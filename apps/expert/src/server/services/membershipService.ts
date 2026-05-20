import { db } from "@adh/db";
import type { MembershipStatus, MembershipCategory } from "@prisma/client";

export interface MembershipValidationResult {
  isValid: boolean;
  membershipId: string | null;
  membershipType: "flexi" | "subscription" | null;
  sessionsRemaining: number | null;
  expiresAt: Date | null;
  planName: string | null;
  reason?: string;
}

/**
 * Validate if a user has an active membership that allows booking.
 * Prioritizes flexi packages (use them first before subscriptions).
 */
export async function validateMembershipForBooking(
  userId: string
): Promise<MembershipValidationResult> {
  const now = new Date();

  // Get all active memberships for user
  const memberships = await db.userMembership.findMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    include: {
      plan: true,
    },
    orderBy: [
      // Prefer flexi packages first (use them before subscriptions)
      { plan: { category: "asc" } },
      // Then by expiry (use soonest expiring first)
      { expiresAt: "asc" },
    ],
  });

  for (const membership of memberships) {
    // Check for active subscription
    if (membership.plan.category === "MONTHLY_SUBSCRIPTION") {
      if (membership.currentPeriodEnd && membership.currentPeriodEnd > now) {
        return {
          isValid: true,
          membershipId: membership.id,
          membershipType: "subscription",
          sessionsRemaining: null, // Unlimited
          expiresAt: membership.currentPeriodEnd,
          planName: membership.plan.name,
        };
      }
    }

    // Check for flexi package with sessions remaining
    if (membership.plan.category === "FLEXI_PACKAGE") {
      // Check expiry
      if (membership.expiresAt && membership.expiresAt < now) {
        continue; // Skip expired package
      }

      // Check sessions remaining
      if (membership.sessionsRemaining && membership.sessionsRemaining > 0) {
        return {
          isValid: true,
          membershipId: membership.id,
          membershipType: "flexi",
          sessionsRemaining: membership.sessionsRemaining,
          expiresAt: membership.expiresAt,
          planName: membership.plan.name,
        };
      }
    }

    // Check for trial
    if (membership.plan.category === "TRIAL") {
      const isExpired = membership.expiresAt && membership.expiresAt < now;
      if (!isExpired) {
        // Unlimited trial (e.g., 1 week trial) or session-based trial with remaining sessions
        const hasAccess = membership.sessionsRemaining === null || membership.sessionsRemaining > 0;
        if (hasAccess) {
          return {
            isValid: true,
            membershipId: membership.id,
            membershipType: membership.sessionsRemaining === null ? "subscription" : "flexi",
            sessionsRemaining: membership.sessionsRemaining,
            expiresAt: membership.expiresAt,
            planName: membership.plan.name,
          };
        }
      }
    }
  }

  return {
    isValid: false,
    membershipId: null,
    membershipType: null,
    sessionsRemaining: null,
    expiresAt: null,
    planName: null,
    reason: "No active membership or sessions remaining",
  };
}

/**
 * Deduct a session from a membership when booking is created.
 * For flexi packages: decrements sessionsRemaining
 * For subscriptions: just records usage
 */
export async function deductSession(
  membershipId: string,
  bookingId: string
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const membership = await tx.userMembership.findUnique({
      where: { id: membershipId },
      include: { plan: true },
    });

    if (!membership) return false;

    // For subscriptions, just record usage without deduction
    if (membership.plan.category === "MONTHLY_SUBSCRIPTION") {
      await tx.sessionUsage.create({
        data: {
          membershipId,
          bookingId,
        },
      });
      return true;
    }

    // For flexi packages and trials, deduct session
    if (
      membership.plan.category === "FLEXI_PACKAGE" ||
      membership.plan.category === "TRIAL"
    ) {
      if (!membership.sessionsRemaining || membership.sessionsRemaining <= 0) {
        return false;
      }

      // Deduct session
      const updated = await tx.userMembership.update({
        where: { id: membershipId },
        data: {
          sessionsRemaining: { decrement: 1 },
          sessionsUsed: { increment: 1 },
        },
      });

      // Record usage
      await tx.sessionUsage.create({
        data: {
          membershipId,
          bookingId,
        },
      });

      // Check if package is now empty and mark as expired
      if (updated.sessionsRemaining === 0) {
        await tx.userMembership.update({
          where: { id: membershipId },
          data: { status: "EXPIRED" },
        });
      }

      return true;
    }

    return false;
  });
}

/**
 * Refund a session to a membership when booking is cancelled.
 * Only refunds for flexi packages, not subscriptions.
 */
export async function refundSession(bookingId: string): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const usage = await tx.sessionUsage.findFirst({
      where: { bookingId },
      include: { membership: { include: { plan: true } } },
    });

    if (!usage) return false;

    // Only refund for flexi packages and trials
    if (
      usage.membership.plan.category === "FLEXI_PACKAGE" ||
      usage.membership.plan.category === "TRIAL"
    ) {
      await tx.userMembership.update({
        where: { id: usage.membershipId },
        data: {
          sessionsRemaining: { increment: 1 },
          sessionsUsed: { decrement: 1 },
          // Reactivate if it was expired due to 0 sessions
          status:
            usage.membership.status === "EXPIRED"
              ? "ACTIVE"
              : usage.membership.status,
        },
      });
    }

    // Delete usage record
    await tx.sessionUsage.delete({
      where: { id: usage.id },
    });

    return true;
  });
}

/**
 * Get a summary of all memberships for a user
 */
export async function getUserMembershipSummary(userId: string) {
  const memberships = await db.userMembership.findMany({
    where: {
      userId,
      status: { in: ["ACTIVE", "PENDING_PAYMENT"] },
    },
    include: {
      plan: true,
      sessionUsages: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return memberships.map((m) => ({
    id: m.id,
    planName: m.plan.name,
    planType: m.plan.planType,
    category: m.plan.category,
    status: m.status,
    sessionsRemaining: m.sessionsRemaining,
    sessionsUsed: m.sessionsUsed,
    expiresAt: m.expiresAt,
    currentPeriodEnd: m.currentPeriodEnd,
    cancelAtPeriodEnd: m.cancelAtPeriodEnd,
    totalUsages: m.sessionUsages.length,
  }));
}

/**
 * Check if user has any active membership
 */
export async function hasActiveMembership(userId: string): Promise<boolean> {
  const result = await validateMembershipForBooking(userId);
  return result.isValid;
}

/**
 * Update membership status based on Stripe subscription status
 */
export function mapStripeStatusToInternal(
  stripeStatus: string
): MembershipStatus {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "canceled":
      return "CANCELLED";
    case "paused":
      return "PAUSED";
    case "past_due":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
      return "PENDING_PAYMENT";
    default:
      // Fail closed: an unrecognised status must not grant access.
      return "PENDING_PAYMENT";
  }
}
