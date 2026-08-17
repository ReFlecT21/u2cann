import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "~/env";

/**
 * Customer-facing billing link. A member opens this (public, no login) and we
 * mint a FRESH Stripe Checkout Session on the spot, then redirect them to it.
 * Because the session is created per-click, the link you send never expires.
 *
 *   /api/billing/checkout?tier=student_98&email=foo@bar.com
 *
 * mode (optional, default "subscribe"):
 *   subscribe  – charge the FULL month's price NOW (one-time, no proration —
 *                same price no matter which day of the month they sign up), and
 *                start a subscription that RENEWS ON THE 1ST of every month at
 *                the full price. The recurring part doesn't charge until the 1st
 *                (billing_cycle_anchor + proration_behavior=none); the current
 *                month is covered by the one-time charge.
 *   save_card  – save a card only (setup mode), no charge, no subscription.
 *                Use for members on hold/break; start them later.
 */

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

/**
 * Unix timestamp for 00:00 Singapore time on the 1st of NEXT month — always a
 * future date, so it's a valid billing_cycle_anchor whenever the link is used.
 */
function nextMonthStartUnix(): number {
  const sgt = new Date(Date.now() + 8 * 3600 * 1000); // shift to SGT wall clock
  let year = sgt.getUTCFullYear();
  let month = sgt.getUTCMonth() + 1; // advance to next month (0-indexed)
  if (month > 11) {
    month = 0;
    year += 1;
  }
  // 00:00 SGT on the 1st = that wall time minus 8h, expressed as a UTC instant.
  const utcMs = Date.UTC(year, month, 1, 0, 0, 0) - 8 * 3600 * 1000;
  return Math.floor(utcMs / 1000);
}

// tier → Stripe prices (LIVE). `recurringPrice` is the monthly subscription
// price (first charge on the 1st); `oneTimePrice` is the same amount as a
// one-time price, charged at signup to cover the current month in full.
const TIERS: Record<
  string,
  { recurringPrice: string; oneTimePrice: string; label: string }
> = {
  adult_175: { recurringPrice: "price_1ToeyZF5WGAAdASVAF07lvBD", oneTimePrice: "price_1ToeyaF5WGAAdASV0acqdIZz", label: "Adult $175/mo" },
  adult_190: { recurringPrice: "price_1ToeybF5WGAAdASVimS7DTy8", oneTimePrice: "price_1ToeybF5WGAAdASV8ILpzCM9", label: "Adult $190/mo" },
  student_98: { recurringPrice: "price_1ToeycF5WGAAdASV95y98NZm", oneTimePrice: "price_1ToeycF5WGAAdASVIh80XWzG", label: "Student $98/mo" },
  student_128: { recurringPrice: "price_1ToeydF5WGAAdASV4v2Efgor", oneTimePrice: "price_1ToeydF5WGAAdASVc4mHLEHd", label: "12 mnth student $128/mo" },
  student_3mth_128: { recurringPrice: "price_1Tpv5UF5WGAAdASValokS6rx", oneTimePrice: "price_1Tpv5UF5WGAAdASVemwXQ4sW", label: "3 mnts student $128/mo" },
  student_monthly_168: { recurringPrice: "price_1U5VDWF5WGAAdASVtWcWI34t", oneTimePrice: "price_1TnDAVF5WGAAdASVIdY13anD", label: "Students monthly $168/mo" },
  student_6mth_140: { recurringPrice: "price_1U5VDXF5WGAAdASV6Ff57MaZ", oneTimePrice: "price_1U5VDYF5WGAAdASVMhjIwABA", label: "6 mnth student $140/mo" },
  kids_75: { recurringPrice: "price_1ToeyeF5WGAAdASVf9Ol72Re", oneTimePrice: "price_1ToeyeF5WGAAdASVYAbKXbpf", label: "Kids $75/mo" },
  nsf_175: { recurringPrice: "price_1ToeyfF5WGAAdASVNd5s6tQn", oneTimePrice: "price_1ToeygF5WGAAdASVBXbazmGI", label: "NSF $175/mo" },
  young_warriors_90: { recurringPrice: "price_1TV8H7F5WGAAdASVgcBnv9es", oneTimePrice: "price_1Tprf2F5WGAAdASVIgDKzRxF", label: "Young Warriors $90/mo" },
  young_warriors_180: { recurringPrice: "price_1Tps2oF5WGAAdASVycokbghg", oneTimePrice: "price_1Tps2oF5WGAAdASVV80BI8AS", label: "Young Warriors x2 $180/mo" },
};

type Mode = "subscribe" | "save_card";

export async function GET(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const { searchParams, origin } = new URL(req.url);
  const tierKey = searchParams.get("tier") ?? "";
  const mode = (searchParams.get("mode") ?? "subscribe") as Mode;
  const email = searchParams.get("email") ?? undefined;

  const success_url = `${origin}/billing/done`;
  const cancel_url = `${origin}/billing/cancelled`;

  try {
    let session: Stripe.Checkout.Session;

    if (mode === "save_card") {
      // Save a card only — no charge, no subscription (for members on hold).
      session = await stripe.checkout.sessions.create({
        mode: "setup",
        payment_method_types: ["card"],
        ...(email ? { customer_email: email } : {}),
        success_url,
        cancel_url,
      });
    } else {
      // subscribe: full month's price charged NOW (one-time, no proration),
      // then the subscription renews on the 1st of every month. proration=none
      // means the recurring line is $0 today and first charges in full on the
      // 1st — the current month is paid by the one-time line above.
      const tier = TIERS[tierKey];
      if (!tier) {
        return NextResponse.json({ error: `Unknown tier '${tierKey}'` }, { status: 400 });
      }
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          { price: tier.recurringPrice, quantity: 1 },
          { price: tier.oneTimePrice, quantity: 1 },
        ],
        // trial_end = 1st of next month: the recurring price is in trial ($0
        // now, first full charge on the 1st, then monthly on the 1st) while the
        // one-time price charges the full current month at checkout. (Can't use
        // billing_cycle_anchor + proration_behavior:none alongside a one-time
        // price — Stripe rejects that combo.)
        subscription_data: { trial_end: nextMonthStartUnix() },
        // Force the member to tick "I agree to the Terms of Service" before they
        // can pay. The linked ToS URL is configured in the Stripe Dashboard; the
        // custom message restates the two key policies at the checkbox itself.
        consent_collection: { terms_of_service: "required" },
        custom_text: {
          terms_of_service_acceptance: {
            message:
              "I agree to U2CAN Boxing's membership terms: (1) cancelling before the end of my committed period requires a penalty of 2 months' membership fees, and (2) a membership may be paused for a maximum of 1 month.",
          },
        },
        ...(email ? { customer_email: email } : {}),
        success_url,
        cancel_url,
      });
    }

    if (!session.url) {
      return NextResponse.json({ error: "No checkout URL" }, { status: 500 });
    }
    return NextResponse.redirect(session.url, 303);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
