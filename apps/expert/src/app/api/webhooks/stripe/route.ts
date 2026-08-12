import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@adh/db";
import { clerkClient } from "@clerk/nextjs/server";
import { env } from "~/env";
import {
  getPlanFromStripeProduct,
  getFlexiExpiryMonths,
} from "~/config/stripe-products";
import { mapStripeStatusToInternal } from "~/server/services/membershipService";
import { grantCredits } from "~/server/services/creditsService";
import { sendWelcomeEmail } from "~/server/services/emailService";
import { reconcileUserAccessSafe } from "~/server/lib/accessReconciler";

// Initialize Stripe only if configured
const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null;

/**
 * Handle checkout.session.completed event
 * This fires when a customer completes a checkout (one-time or subscription)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerEmail =
    session.customer_email || session.customer_details?.email;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string | null;

  if (!customerEmail) {
    console.error("[Stripe Webhook] No customer email in checkout session");
    return;
  }

  // Only activate a membership once payment has actually cleared.
  // - Card checkouts: this event fires post-payment (payment_status="paid").
  // - PayNow / async methods: this event fires immediately with
  //   payment_status="unpaid"; the real confirmation arrives later as
  //   checkout.session.async_payment_succeeded (also routed here, by then
  //   payment_status="paid"). Deferring here prevents granting gym access
  //   before the money lands.
  const isPaid =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";
  if (!isPaid) {
    console.log(
      `[Stripe Webhook] Checkout ${session.id} not paid yet (payment_status=${session.payment_status}); deferring activation`
    );
    return;
  }

  // Get payment method details
  let paymentMethod: string | null = null;
  let paymentMethodDetails: string | null = null;

  if (session.payment_intent) {
    const paymentIntent = await stripe!.paymentIntents.retrieve(
      session.payment_intent as string,
      { expand: ["payment_method"] }
    );

    const pm = paymentIntent.payment_method as Stripe.PaymentMethod | null;
    if (pm) {
      paymentMethod = pm.type; // "card", "paynow", "grabpay", etc.

      // Build human-readable details
      if (pm.type === "card" && pm.card) {
        const brand = pm.card.brand?.charAt(0).toUpperCase() + pm.card.brand?.slice(1);
        paymentMethodDetails = `${brand} •••• ${pm.card.last4}`;
      } else if (pm.type === "paynow") {
        paymentMethodDetails = "PayNow";
      } else if (pm.type === "grabpay") {
        paymentMethodDetails = "GrabPay";
      } else {
        paymentMethodDetails = pm.type.charAt(0).toUpperCase() + pm.type.slice(1);
      }

      console.log(`[Stripe Webhook] Payment method: ${paymentMethod} (${paymentMethodDetails})`);
    }
  }

  // Get line items to determine the product/plan
  const lineItems = await stripe!.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
  });

  const lineItem = lineItems.data[0];
  if (!lineItem?.price) {
    console.error("[Stripe Webhook] No price found in checkout session");
    return;
  }

  const product = lineItem.price.product as Stripe.Product;
  const productId = product.id;
  const priceId = lineItem.price.id;

  // Credit-pack purchase? These are admin-managed in the DB and grant credits
  // to the user's wallet. They are booking-only: NO membership is created and
  // NO door access is granted. Checked before the membership path so a credit
  // product never falls through to plan handling.
  // Match on product id OR price id, whichever the admin registered.
  const creditProduct = await db.creditProduct.findFirst({
    where: {
      OR: [{ stripeProductId: productId }, { stripePriceId: priceId }],
    },
  });
  if (creditProduct) {
    if (!creditProduct.isActive) {
      console.warn(
        `[Stripe Webhook] Credit product ${productId} is inactive; skipping grant`
      );
      return;
    }

    const clerkUser = await findOrCreateClerkUser(
      customerEmail,
      session.customer_details?.name
    );
    const dbUser = await ensureDbUser(
      clerkUser.id,
      customerEmail,
      session.customer_details?.name
    );

    await grantCredits({
      userId: dbUser.id,
      amount: creditProduct.creditsGranted,
      type: "PURCHASE",
      productId: creditProduct.id,
      sourceRef: session.id,
      reason: `Purchase: ${creditProduct.name}`,
    });

    console.log(
      `[Stripe Webhook] Granted ${creditProduct.creditsGranted} credits to ${dbUser.id} (${creditProduct.name})`
    );

    await sendWelcomeEmail({
      to: customerEmail,
      firstName: session.customer_details?.name?.split(" ")[0],
    });

    // Intentionally NO UserMembership and NO door-access reconcile.
    return;
  }

  const planConfig = getPlanFromStripeProduct(productId);
  if (!planConfig) {
    console.error(`[Stripe Webhook] Unknown Stripe product ID: ${productId}`);
    return;
  }

  console.log(
    `[Stripe Webhook] Processing checkout for ${customerEmail}, product: ${productId}, plan: ${planConfig.planType}`
  );

  // Step 1: Find or create Clerk user
  const clerkUser = await findOrCreateClerkUser(
    customerEmail,
    session.customer_details?.name
  );

  // Step 2: Ensure user exists in database
  const dbUser = await ensureDbUser(
    clerkUser.id,
    customerEmail,
    session.customer_details?.name
  );

  // Step 3: Find or create the MembershipPlan in database
  const plan = await db.membershipPlan.upsert({
    where: { planType: planConfig.planType },
    update: {
      name: planConfig.name,
      stripePriceId: priceId,
      stripeProductId: productId,
    },
    create: {
      planType: planConfig.planType,
      category: planConfig.category,
      name: planConfig.name,
      stripePriceId: priceId,
      stripeProductId: productId,
      sessionsIncluded: planConfig.sessionsIncluded,
      commitmentMonths: planConfig.commitmentMonths,
      priceInCents: planConfig.priceInCents,
    },
  });

  // Step 4: Calculate dates based on plan type
  const now = new Date();
  let expiresAt: Date | null = null;
  let currentPeriodEnd: Date | null = null;
  let commitmentEndDate: Date | null = null;

  if (planConfig.category === "FLEXI_PACKAGE" || planConfig.category === "TRIAL") {
    expiresAt = new Date(now);
    if (plan.expiryDays) {
      // Short-term plans (e.g., 1 week trial)
      expiresAt.setDate(expiresAt.getDate() + plan.expiryDays);
    } else {
      // Flexi packages expire after N months
      const expiryMonths = getFlexiExpiryMonths(planConfig);
      expiresAt.setMonth(expiresAt.getMonth() + expiryMonths);
    }
  }

  if (planConfig.category === "MONTHLY_SUBSCRIPTION") {
    if (subscriptionId) {
      // Stripe auto-recurring subscription
      const subscription = await stripe!.subscriptions.retrieve(subscriptionId, {
        expand: ["default_payment_method"],
      });
      currentPeriodEnd = subscriptionPeriod(subscription).end;

      // For subscriptions, get payment method from subscription if not already set
      if (!paymentMethod && subscription.default_payment_method) {
        const pm = subscription.default_payment_method as Stripe.PaymentMethod;
        paymentMethod = pm.type;

        if (pm.type === "card" && pm.card) {
          const brand = pm.card.brand?.charAt(0).toUpperCase() + pm.card.brand?.slice(1);
          paymentMethodDetails = `${brand} •••• ${pm.card.last4}`;
        } else if (pm.type === "paynow") {
          paymentMethodDetails = "PayNow";
        } else if (pm.type === "grabpay") {
          paymentMethodDetails = "GrabPay";
        } else {
          paymentMethodDetails = pm.type.charAt(0).toUpperCase() + pm.type.slice(1);
        }

        console.log(`[Stripe Webhook] Subscription payment method: ${paymentMethod} (${paymentMethodDetails})`);
      }
    } else {
      // One-time payment (e.g., PayNow) for monthly subscription - extend by 1 month
      currentPeriodEnd = new Date(now);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    if (planConfig.commitmentMonths) {
      commitmentEndDate = new Date(now);
      commitmentEndDate.setMonth(
        commitmentEndDate.getMonth() + planConfig.commitmentMonths
      );
    }
  }

  // Step 5: Check if user already has an active membership for this plan (renewal payment)
  const existingMembership = await db.userMembership.findFirst({
    where: {
      userId: dbUser.id,
      planId: plan.id,
      status: "ACTIVE",
    },
  });

  if (existingMembership && planConfig.category === "MONTHLY_SUBSCRIPTION") {
    // Work out the new period end:
    // - Real Stripe subscription (subscriptionId present): use the
    //   subscription's actual period end (already fetched into currentPeriodEnd).
    // - One-time PayNow renewal (no subscriptionId): extend by 1 month from the
    //   current expiry (or now if lapsed).
    let newPeriodEnd: Date;
    if (subscriptionId && currentPeriodEnd) {
      newPeriodEnd = currentPeriodEnd;
    } else {
      const extendFrom =
        existingMembership.currentPeriodEnd &&
        existingMembership.currentPeriodEnd > now
          ? new Date(existingMembership.currentPeriodEnd)
          : now;
      newPeriodEnd = new Date(extendFrom);
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    }

    await db.userMembership.update({
      where: { id: existingMembership.id },
      data: {
        status: "ACTIVE",
        currentPeriodEnd: newPeriodEnd,
        expiresAt: newPeriodEnd,
        paymentMethod,
        paymentMethodDetails,
        stripeCustomerId: customerId,
        // Store the subscription id so future customer.subscription.* events
        // (renewals, cancellations, failed payments) sync to THIS membership.
        // Only set it when we actually have one — never clobber an existing id
        // with null on a one-time PayNow top-up.
        ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
        // Keep the commitment window in sync when the plan defines one.
        ...(commitmentEndDate ? { commitmentEndDate } : {}),
      },
    });

    console.log(
      `[Stripe Webhook] Renewed membership ${existingMembership.id} for user ${dbUser.id}` +
        (subscriptionId ? ` (subscription ${subscriptionId})` : "") +
        `, new expiry: ${newPeriodEnd.toISOString()}`
    );
  } else if (existingMembership && planConfig.category === "FLEXI_PACKAGE") {
    // Flexi top-up: add sessions to existing package
    await db.userMembership.update({
      where: { id: existingMembership.id },
      data: {
        status: "ACTIVE",
        sessionsRemaining: {
          increment: planConfig.sessionsIncluded ?? 0,
        },
        expiresAt, // Reset expiry from now
        paymentMethod,
        paymentMethodDetails,
        stripeCustomerId: customerId,
      },
    });

    console.log(
      `[Stripe Webhook] Topped up flexi membership ${existingMembership.id} for user ${dbUser.id}, added ${planConfig.sessionsIncluded} sessions`
    );
  } else {
    // New membership
    await db.userMembership.create({
      data: {
        userId: dbUser.id,
        planId: plan.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        paymentMethod,
        paymentMethodDetails,
        status: "ACTIVE",
        sessionsRemaining: planConfig.sessionsIncluded,
        currentPeriodStart: now,
        currentPeriodEnd: currentPeriodEnd ?? expiresAt,
        commitmentEndDate,
        activatedAt: now,
        expiresAt: expiresAt ?? currentPeriodEnd,
      },
    });

    console.log(
      `[Stripe Webhook] Created membership for user ${dbUser.id}, plan: ${planConfig.planType}`
    );
  }

  // Step 6: Send welcome email
  const firstName = session.customer_details?.name?.split(" ")[0];
  await sendWelcomeEmail({
    to: customerEmail,
    firstName,
  });

  // Step 7: Reconcile camera access. Payment just landed so the user
  // may now qualify for door entry (or stay qualified if renewing).
  // Fire-and-forget so the webhook responds quickly to Stripe.
  void reconcileUserAccessSafe(dbUser.id);
}

/**
 * Newer Stripe API versions (2025-03+) moved current_period_start/end off the
 * subscription onto its items — webhook payloads on those versions have NO
 * top-level period fields, and `new Date(undefined * 1000)` is an Invalid Date
 * that made every renewal update throw (memberships were stuck at their
 * signup period end). Read item-level first, fall back to top-level.
 */
function subscriptionPeriod(subscription: Stripe.Subscription): {
  start: Date | null;
  end: Date | null;
} {
  const item = subscription.items?.data?.[0] as
    | { current_period_start?: number; current_period_end?: number }
    | undefined;
  const legacy = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };
  const startTs = item?.current_period_start ?? legacy.current_period_start;
  const endTs = item?.current_period_end ?? legacy.current_period_end;
  return {
    start: typeof startTs === "number" ? new Date(startTs * 1000) : null,
    end: typeof endTs === "number" ? new Date(endTs * 1000) : null,
  };
}

/**
 * Handle subscription updated event
 * Updates period dates and status
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const membership = await db.userMembership.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!membership) {
    console.log(
      `[Stripe Webhook] No membership found for subscription ${subscription.id}`
    );
    return;
  }

  const period = subscriptionPeriod(subscription);
  await db.userMembership.update({
    where: { id: membership.id },
    data: {
      ...(period.start ? { currentPeriodStart: period.start } : {}),
      ...(period.end ? { currentPeriodEnd: period.end } : {}),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      status: mapStripeStatusToInternal(subscription.status),
    },
  });

  console.log(
    `[Stripe Webhook] Updated membership ${membership.id} from subscription ${subscription.id}`
  );

  // Status may have flipped (active <-> past_due/canceled/paused) — push
  // the door state in line with the new reality. Fire-and-forget.
  void reconcileUserAccessSafe(membership.userId);
}

/**
 * Handle subscription deleted event
 * Marks membership as cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const memberships = await db.userMembership.findMany({
    where: { stripeSubscriptionId: subscription.id },
    select: { userId: true },
  });

  await db.userMembership.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  console.log(
    `[Stripe Webhook] Cancelled membership for subscription ${subscription.id}`
  );

  for (const m of memberships) {
    void reconcileUserAccessSafe(m.userId);
  }
}

/**
 * Handle invoice payment failed event
 * Marks membership as pending payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const memberships = await db.userMembership.findMany({
    where: { stripeSubscriptionId: invoice.subscription as string },
    select: { userId: true },
  });

  await db.userMembership.updateMany({
    where: { stripeSubscriptionId: invoice.subscription as string },
    data: { status: "PENDING_PAYMENT" },
  });

  console.log(
    `[Stripe Webhook] Marked membership as pending payment for subscription ${invoice.subscription}`
  );

  for (const m of memberships) {
    void reconcileUserAccessSafe(m.userId);
  }
}

/**
 * Handle a deferred payment (e.g. PayNow) that ultimately failed.
 * We never activated the membership on the initial checkout.session.completed
 * (payment_status was "unpaid"), so usually there's nothing to revoke. But if
 * a membership exists for this subscription, mark it pending and re-sync the
 * door so access is closed.
 */
async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
  const subscriptionId = session.subscription as string | null;
  if (!subscriptionId) {
    console.log(
      `[Stripe Webhook] Async payment failed for checkout ${session.id} (no subscription, nothing to revoke)`
    );
    return;
  }

  const memberships = await db.userMembership.findMany({
    where: { stripeSubscriptionId: subscriptionId },
    select: { id: true, userId: true },
  });

  if (memberships.length === 0) return;

  await db.userMembership.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: "PENDING_PAYMENT" },
  });

  console.log(
    `[Stripe Webhook] Async payment failed; marked ${memberships.length} membership(s) pending for subscription ${subscriptionId}`
  );

  for (const m of memberships) {
    void reconcileUserAccessSafe(m.userId);
  }
}

/**
 * Find existing Clerk user or create a new one
 */
async function findOrCreateClerkUser(email: string, name?: string | null) {
  const client = await clerkClient();

  // Try to find existing user by email
  const existingUsers = await client.users.getUserList({
    emailAddress: [email],
  });

  if (existingUsers.totalCount > 0) {
    console.log(`[Stripe Webhook] Found existing Clerk user for ${email}`);
    return existingUsers.data[0];
  }

  // Create new user - they will sign in via OTP
  const [firstName, ...lastNameParts] = (name || "").split(" ");
  const lastName = lastNameParts.join(" ");

  console.log(`[Stripe Webhook] Creating new Clerk user for ${email}`);
  const newUser = await client.users.createUser({
    emailAddress: [email],
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    skipPasswordRequirement: true, // Will use OTP
  });

  return newUser;
}

/**
 * Ensure user exists in database
 * Handles case where email already exists with different ID
 */
async function ensureDbUser(
  clerkId: string,
  email: string,
  name?: string | null
) {
  // First, check if user exists by clerk ID
  const existingById = await db.user.findUnique({
    where: { id: clerkId },
  });

  if (existingById) {
    console.log(`[Stripe Webhook] User ${clerkId} already exists in DB`);
    return existingById;
  }

  // Check if user exists by email (might be from a different clerk account)
  const existingByEmail = await db.user.findUnique({
    where: { email },
  });

  if (existingByEmail) {
    // User exists with this email but different clerk ID
    // Delete old record and create new one with new clerk ID
    // This handles the case where user re-registered with Clerk
    console.log(
      `[Stripe Webhook] Migrating user from ${existingByEmail.id} to ${clerkId} for email ${email}`
    );

    // Use transaction to safely migrate user
    return db.$transaction(async (tx) => {
      // Delete old user (cascades to related records)
      await tx.user.delete({
        where: { id: existingByEmail.id },
      });

      // Create new user with new clerk ID
      return tx.user.create({
        data: {
          id: clerkId,
          email,
          name: name || existingByEmail.name,
          role: existingByEmail.role,
        },
      });
    });
  }

  // Create new user
  console.log(`[Stripe Webhook] Creating new user ${clerkId} for email ${email}`);
  return db.user.create({
    data: {
      id: clerkId,
      email,
      name: name || null,
      role: "trainee",
    },
  });
}

/**
 * POST handler for Stripe webhooks
 */
export async function POST(req: NextRequest) {
  // Check if Stripe is configured
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    console.error("[Stripe Webhook] Stripe not configured");
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.error("[Stripe Webhook] No signature header");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check - prevent duplicate processing
  const existingEvent = await db.stripeEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existingEvent) {
    console.log(`[Stripe Webhook] Duplicate event ${event.id}, skipping`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Record event for idempotency
  await db.stripeEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
    },
  });

  console.log(`[Stripe Webhook] Processing event ${event.type} (${event.id})`);

  // Handle events
  try {
    switch (event.type) {
      case "checkout.session.completed":
      // async_payment_succeeded fires when a deferred method (e.g. PayNow)
      // finally settles. By then payment_status is "paid", so the same
      // handler activates the membership.
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "checkout.session.async_payment_failed":
        await handleAsyncPaymentFailed(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
