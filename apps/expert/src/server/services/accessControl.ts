import { db } from "@adh/db";

// Reasons returned by evaluateAccess. The string values are stored on
// AccessEvent.membershipStateAtScan so they need to stay stable.
export type AccessReason =
  | "staff_bypass"
  | "active_member_unrestricted"
  | "active_member_within_booking"
  // Entry granted purely off a confirmed booking in the class window, with no
  // door-granting membership. This is how credit-pack buyers (credits are
  // booking-only) get in for the classes they've booked.
  | "confirmed_booking"
  | "no_membership"
  | "payment_pending"
  | "membership_expired"
  | "membership_cancelled"
  | "membership_paused"
  | "plan_requires_booking_no_booking"
  | "plan_requires_booking_outside_window"
  | "user_not_found";

const ALLOWED_REASONS = new Set<AccessReason>([
  "staff_bypass",
  "active_member_unrestricted",
  "active_member_within_booking",
  "confirmed_booking",
]);

export interface AccessDecision {
  allowed: boolean;
  reason: AccessReason;
  membershipId: string | null;
  expiresAt: Date | null;
}

// How far before / after a booked session to count as "within window".
// Members on booking-required plans can tap in from this many minutes
// before their session start and stay tapping in this many minutes
// after it ends (handy for warm-up / cool-down).
const BOOKING_PRE_MINUTES = 15;
const BOOKING_POST_MINUTES = 30;

export function isAllowedReason(reason: AccessReason): boolean {
  return ALLOWED_REASONS.has(reason);
}

/**
 * Does the user have a confirmed booking for a session happening around
 * `atTime`? Window: from BOOKING_PRE_MINUTES before start through
 * BOOKING_POST_MINUTES after end. Returns the booking id, or null.
 */
async function findBookingInWindow(
  userId: string,
  atTime: Date,
): Promise<string | null> {
  const windowOpen = new Date(atTime.getTime() - BOOKING_POST_MINUTES * 60_000);
  const windowClose = new Date(atTime.getTime() + BOOKING_PRE_MINUTES * 60_000);
  const booking = await db.classBooking.findFirst({
    where: {
      userId,
      status: "confirmed",
      session: {
        isCancelled: false,
        // session is starting soon (<= now + PRE) and hasn't long ended (>= now - POST)
        startTime: { lte: windowClose },
        endTime: { gte: windowOpen },
      },
    },
    select: { id: true },
  });
  return booking?.id ?? null;
}

/**
 * Source of truth for "can this user enter the gym right now?".
 * Used by the reconciler cron, the Hikvision webhook, and admin UI.
 *
 * Fails closed: if the DB read throws, caller treats the user as denied.
 */
export async function evaluateAccess(
  userId: string,
  atTime: Date = new Date(),
): Promise<AccessDecision> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) {
    return {
      allowed: false,
      reason: "user_not_found",
      membershipId: null,
      expiresAt: null,
    };
  }

  // Staff always allowed regardless of membership state.
  if (user.role === "admin" || user.role === "coach") {
    return {
      allowed: true,
      reason: "staff_bypass",
      membershipId: null,
      expiresAt: null,
    };
  }

  const memberships = await db.userMembership.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: [
      // Prefer flexi packages first (use them before subscriptions)
      { plan: { category: "asc" } },
      { expiresAt: "asc" },
    ],
  });

  // Note: we don't early-return on zero memberships — a credit-pack buyer has
  // no membership but may still have a booking that opens the door (checked
  // after the membership loop below). worstReason defaults to no_membership.

  // Track the "best" non-active state to report when no membership is usable.
  // Priority: payment_pending > paused > expired > cancelled (most actionable first).
  let worstReason: AccessReason = "no_membership";
  const reasonPriority: Record<AccessReason, number> = {
    payment_pending: 4,
    membership_paused: 3,
    membership_expired: 2,
    membership_cancelled: 1,
    no_membership: 0,
  } as Record<AccessReason, number>;

  for (const m of memberships) {
    if (m.status === "PENDING_PAYMENT") {
      if ((reasonPriority[worstReason] ?? -1) < 4)
        worstReason = "payment_pending";
      continue;
    }
    if (m.status === "PAUSED") {
      if ((reasonPriority[worstReason] ?? -1) < 3)
        worstReason = "membership_paused";
      continue;
    }
    if (m.status === "EXPIRED") {
      if ((reasonPriority[worstReason] ?? -1) < 2)
        worstReason = "membership_expired";
      continue;
    }
    if (m.status === "CANCELLED") {
      // cancelAtPeriodEnd=true with period still in the future is treated
      // as ACTIVE by Stripe webhook (status stays ACTIVE); a CANCELLED
      // row here means it's already past its useful life.
      if ((reasonPriority[worstReason] ?? -1) < 1)
        worstReason = "membership_cancelled";
      continue;
    }
    if (m.status !== "ACTIVE") continue;

    // ACTIVE — check the per-category usable window.
    const expiresAt =
      m.plan.category === "MONTHLY_SUBSCRIPTION"
        ? m.currentPeriodEnd
        : m.expiresAt;

    if (m.plan.category === "MONTHLY_SUBSCRIPTION") {
      if (!m.currentPeriodEnd || m.currentPeriodEnd <= atTime) {
        if ((reasonPriority[worstReason] ?? -1) < 2)
          worstReason = "membership_expired";
        continue;
      }
    } else if (m.plan.category === "FLEXI_PACKAGE") {
      if (m.expiresAt && m.expiresAt <= atTime) {
        if ((reasonPriority[worstReason] ?? -1) < 2)
          worstReason = "membership_expired";
        continue;
      }
      // Note: we intentionally allow door entry even with 0 sessions
      // remaining, as long as the package hasn't expired. Session
      // counting happens at booking time, not at door entry.
    } else if (m.plan.category === "TRIAL") {
      if (m.expiresAt && m.expiresAt <= atTime) {
        if ((reasonPriority[worstReason] ?? -1) < 2)
          worstReason = "membership_expired";
        continue;
      }
    }

    // Plan requires a current booking to enter — check that.
    if (m.plan.requiresBookingForEntry) {
      const bookingId = await findBookingInWindow(userId, atTime);
      if (!bookingId) {
        return {
          allowed: false,
          reason: "plan_requires_booking_no_booking",
          membershipId: m.id,
          expiresAt,
        };
      }
      return {
        allowed: true,
        reason: "active_member_within_booking",
        membershipId: m.id,
        expiresAt,
      };
    }

    return {
      allowed: true,
      reason: "active_member_unrestricted",
      membershipId: m.id,
      expiresAt,
    };
  }

  // No usable membership. A confirmed booking for a class happening now still
  // opens the door — this is how credit-pack buyers (credits are booking-only,
  // they hold no membership) get in for the classes they've booked.
  const bookingId = await findBookingInWindow(userId, atTime);
  if (bookingId) {
    return {
      allowed: true,
      reason: "confirmed_booking",
      membershipId: null,
      expiresAt: null,
    };
  }

  return {
    allowed: false,
    reason: worstReason,
    membershipId: null,
    expiresAt: null,
  };
}

/**
 * Human-readable message paired with each reason. Used in emails and
 * admin UI tooltips. Keep these short and member-friendly.
 */
export function describeAccessReason(reason: AccessReason): string {
  switch (reason) {
    case "staff_bypass":
      return "Staff bypass";
    case "active_member_unrestricted":
      return "Active membership";
    case "active_member_within_booking":
      return "Active membership with booked session";
    case "confirmed_booking":
      return "Booked class in progress (credit/booking entry)";
    case "no_membership":
      return "No active membership on file";
    case "payment_pending":
      return "Payment is pending or overdue";
    case "membership_expired":
      return "Membership has expired";
    case "membership_cancelled":
      return "Membership was cancelled";
    case "membership_paused":
      return "Membership is paused";
    case "plan_requires_booking_no_booking":
      return "Your plan requires a booked class to enter — no session booked";
    case "plan_requires_booking_outside_window":
      return "Your plan requires a booked class — you're outside the entry window";
    case "user_not_found":
      return "User record not found";
  }
}
