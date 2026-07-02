import type { MembershipPlanType, MembershipCategory } from "@prisma/client";

export interface StripePlanConfig {
  planType: MembershipPlanType;
  category: MembershipCategory;
  name: string;
  sessionsIncluded: number | null; // null = unlimited
  commitmentMonths: number | null;
  priceInCents: number;
  flexiExpiryMonths?: number; // How long flexi pack is valid (default 6 months)
}

/**
 * Map Stripe Product IDs to internal plan configuration.
 * Update these IDs with your actual Stripe Product IDs.
 *
 * To find your Product IDs:
 * 1. Go to Stripe Dashboard → Products
 * 2. Click on each product
 * 3. Copy the Product ID (starts with "prod_")
 */
export const STRIPE_PRODUCT_TO_PLAN: Record<string, StripePlanConfig> = {
  // ===== FREE TRIAL =====
  // Product: Free Trial - SGD 0.00
  prod_Tft8gngNNnwXQ8: {
    planType: "FREE_TRIAL",
    category: "TRIAL",
    name: "Free Trial",
    sessionsIncluded: 1,
    commitmentMonths: null,
    priceInCents: 0,
    flexiExpiryMonths: 1,
  },

  // ===== 1 WEEK TRIAL =====
  // Product: 1 Week Trial - SGD 35.00 (unlimited for 1 week)
  prod_UF921mnYLf7UdE: {
    planType: "TRIAL_WEEK",
    category: "TRIAL",
    name: "1 Week Trial",
    sessionsIncluded: null, // Unlimited
    commitmentMonths: null,
    priceInCents: 3500,
  },

  // ===== TRIAL CLASS =====
  // Product: Trial Class - SGD 10.00 (single session)
  prod_TnPx5MPbWLtVH4: {
    planType: "TRIAL_CLASS",
    category: "TRIAL",
    name: "Trial Class",
    sessionsIncluded: 1,
    commitmentMonths: null,
    priceInCents: 1000,
    flexiExpiryMonths: 1,
  },

  // ===== FLEXI PACKAGES (One-time, session-based) =====

  // Adult Flexi Package - 10 Session Pass - SGD 350.00
  prod_Tft2CsejysdWjx: {
    planType: "FLEXI_ADULT_10",
    category: "FLEXI_PACKAGE",
    name: "Adult Flexi Package - 10 Sessions",
    sessionsIncluded: 10,
    commitmentMonths: null,
    priceInCents: 35000,
    flexiExpiryMonths: 6,
  },

  // Adult Flexi Package - 5 Session Pass - SGD 205.00
  prod_Tft1S6AbMv17fS: {
    planType: "FLEXI_ADULT_5",
    category: "FLEXI_PACKAGE",
    name: "Adult Flexi Package - 5 Sessions",
    sessionsIncluded: 5,
    commitmentMonths: null,
    priceInCents: 20500,
    flexiExpiryMonths: 6,
  },

  // Youth Flexi Package - 10 Session Pass - SGD 350.00
  prod_Tft0i8C9ENKL4y: {
    planType: "FLEXI_YOUTH_10",
    category: "FLEXI_PACKAGE",
    name: "Youth Flexi Package - 10 Sessions",
    sessionsIncluded: 10,
    commitmentMonths: null,
    priceInCents: 35000,
    flexiExpiryMonths: 6,
  },

  // Youth Flexi Package - 5 Session Pass - SGD 205.00
  prod_TfszCQ0nQPkdCC: {
    planType: "FLEXI_YOUTH_5",
    category: "FLEXI_PACKAGE",
    name: "Youth Flexi Package - 5 Sessions",
    sessionsIncluded: 5,
    commitmentMonths: null,
    priceInCents: 20500,
    flexiExpiryMonths: 6,
  },

  // Junior Flexi Package - 10 Session Pass - SGD 285.00
  prod_Tfsyu52WUS3VDX: {
    planType: "FLEXI_JUNIOR_10",
    category: "FLEXI_PACKAGE",
    name: "Junior Flexi Package - 10 Sessions",
    sessionsIncluded: 10,
    commitmentMonths: null,
    priceInCents: 28500,
    flexiExpiryMonths: 6,
  },

  // Junior Flexi Package - 5 Session Pass - SGD 150.00
  prod_TfsyXTkjC3Xgo9: {
    planType: "FLEXI_JUNIOR_5",
    category: "FLEXI_PACKAGE",
    name: "Junior Flexi Package - 5 Sessions",
    sessionsIncluded: 5,
    commitmentMonths: null,
    priceInCents: 15000,
    flexiExpiryMonths: 6,
  },

  // ===== MONTHLY MEMBERSHIPS - ADULT =====

  // Adults Monthly Membership - 12 Months (DEPRECATED)
  prod_TyJEKUH4wvPRcK: {
    planType: "MONTHLY_ADULT_1YR_DEPRECATED",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Adults Monthly Membership - 12 Months (Deprecated)",
    sessionsIncluded: null, // Unlimited
    commitmentMonths: 12,
    priceInCents: 17500,
  },

  // Adults Monthly Membership - 1 Year Package - SGD 175.00/month
  prod_TfsnoM0t71J5zO: {
    planType: "MONTHLY_ADULT_1YR",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Adults Monthly Membership - 1 Year",
    sessionsIncluded: null, // Unlimited
    commitmentMonths: 12,
    priceInCents: 17500,
  },

  // Adults Monthly Membership - 6 Months Package - SGD 192.00/month
  prod_TfsledpOQsyR7S: {
    planType: "MONTHLY_ADULT_6MO",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Adults Monthly Membership - 6 Months",
    sessionsIncluded: null,
    commitmentMonths: 6,
    priceInCents: 19200,
  },

  // Adult Monthly Membership - 3 Months Package - SGD 209.00/month
  prod_Tfsj2Oe4cINuX5: {
    planType: "MONTHLY_ADULT_3MO",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Adults Monthly Membership - 3 Months",
    sessionsIncluded: null,
    commitmentMonths: 3,
    priceInCents: 20900,
  },

  // Adults Monthly Membership - SGD 223.00/month (no commitment)
  prod_Tfsj889ZSsjPcn: {
    planType: "MONTHLY_ADULT",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Adults Monthly Membership",
    sessionsIncluded: null,
    commitmentMonths: 1,
    priceInCents: 22300,
  },

  // ===== MONTHLY MEMBERSHIPS - STUDENT =====

  // Student Monthly Membership - 1 Year Package - SGD 98.00/month
  prod_Tfsb4Pk9Ep6B5e: {
    planType: "MONTHLY_STUDENT_1YR",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Student Monthly Membership - 1 Year",
    sessionsIncluded: null,
    commitmentMonths: 12,
    priceInCents: 9800,
  },

  // Student Monthly Membership - 6 Months package - SGD 109.00/month
  prod_TfsaOxO2uHh3NE: {
    planType: "MONTHLY_STUDENT_6MO",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Student Monthly Membership - 6 Months",
    sessionsIncluded: null,
    commitmentMonths: 6,
    priceInCents: 10900,
  },

  // Student Monthly Membership - 3 Months package - SGD 117.00/month
  prod_TfsaaRAijAzAzV: {
    planType: "MONTHLY_STUDENT_3MO",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Student Monthly Membership - 3 Months",
    sessionsIncluded: null,
    commitmentMonths: 3,
    priceInCents: 11700,
  },

  // Student Monthly Membership - SGD 132.00/month
  prod_TfsIKwWxa9klZT: {
    planType: "MONTHLY_STUDENT",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Student Monthly Membership",
    sessionsIncluded: null,
    commitmentMonths: 1,
    priceInCents: 13200,
  },

  // ===== MONTHLY MEMBERSHIPS - NSF/NSMEN =====

  // NSF/NSMEN Monthly Membership - 1 Year Package - SGD 158.00/month
  prod_TfsfHuMMI3SNVh: {
    planType: "MONTHLY_NSF_1YR",
    category: "MONTHLY_SUBSCRIPTION",
    name: "NSF/NSMEN Monthly Membership - 1 Year",
    sessionsIncluded: null,
    commitmentMonths: 12,
    priceInCents: 15800,
  },

  // NSF/NSMEN Monthly Membership - 6 Months Package - SGD 175.00/month
  prod_TfsfXRdTQbgMeS: {
    planType: "MONTHLY_NSF_6MO",
    category: "MONTHLY_SUBSCRIPTION",
    name: "NSF/NSMEN Monthly Membership - 6 Months",
    sessionsIncluded: null,
    commitmentMonths: 6,
    priceInCents: 17500,
  },

  // NSF/NSMEN Monthly Membership - 3 Months Package - SGD 192.00/month
  prod_TfseuoXMJeNVw9: {
    planType: "MONTHLY_NSF_3MO",
    category: "MONTHLY_SUBSCRIPTION",
    name: "NSF/NSMEN Monthly Membership - 3 Months",
    sessionsIncluded: null,
    commitmentMonths: 3,
    priceInCents: 19200,
  },

  // NSF/NSMEN Monthly Membership - SGD 214.00/month
  prod_TfscqLfFIbrfGO: {
    planType: "MONTHLY_NSF",
    category: "MONTHLY_SUBSCRIPTION",
    name: "NSF/NSMEN Monthly Membership",
    sessionsIncluded: null,
    commitmentMonths: 1,
    priceInCents: 21400,
  },

  // ===== MONTHLY MEMBERSHIPS - JUNIOR =====

  // Junior Monthly Membership - 1 Year Package - SGD 76.00/month
  prod_TfsEQ8mhmKAzjF: {
    planType: "MONTHLY_JUNIOR_1YR",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Junior Monthly Membership - 1 Year",
    sessionsIncluded: null,
    commitmentMonths: 12,
    priceInCents: 7600,
  },

  // Junior Monthly Membership - 6 Months Package - SGD 84.00/month
  prod_TfXOx3GdvRh6z3: {
    planType: "MONTHLY_JUNIOR_6MO",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Junior Monthly Membership - 6 Months",
    sessionsIncluded: null,
    commitmentMonths: 6,
    priceInCents: 8400,
  },

  // Junior Monthly Membership - 3 Months Package - SGD 93.00/month
  prod_TfXN1aF7mLXpEr: {
    planType: "MONTHLY_JUNIOR_3MO",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Junior Monthly Membership - 3 Months",
    sessionsIncluded: null,
    commitmentMonths: 3,
    priceInCents: 9300,
  },

  // Junior Monthly Membership - SGD 108.00/month
  prod_TfXMQvCD2rNgwc: {
    planType: "MONTHLY_JUNIOR",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Junior Monthly Membership",
    sessionsIncluded: null,
    commitmentMonths: 1,
    priceInCents: 10800,
  },

  // ===== Auto-pay membership products (LIVE) =====
  // Dedicated products for the /api/billing/checkout monthly auto-pay flow.
  // Each has a recurring monthly price + a one-time price (both on the same
  // product), so the webhook resolves this productId to the plan below.
  prod_UoHXgxQNe7WeeF: {
    planType: "MONTHLY_ADULT_1YR",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Adult Membership (Monthly)",
    sessionsIncluded: null,
    commitmentMonths: 12,
    priceInCents: 17500,
  },
  prod_UoHX4DUjGbsj3G: {
    planType: "MONTHLY_ADULT",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Adult Membership New (Monthly)",
    sessionsIncluded: null,
    commitmentMonths: 1,
    priceInCents: 19000,
  },
  prod_UoHXlRjM7si2er: {
    planType: "MONTHLY_STUDENT_1YR",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Student Membership (Monthly)",
    sessionsIncluded: null,
    commitmentMonths: 12,
    priceInCents: 9800,
  },
  prod_UoHXf02Lp3jWNH: {
    planType: "MONTHLY_STUDENT",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Muay Thai Student (Monthly)",
    sessionsIncluded: null,
    commitmentMonths: 1,
    priceInCents: 12800,
  },
  prod_UoHXDaN7e47LAU: {
    planType: "MONTHLY_JUNIOR_1YR",
    category: "MONTHLY_SUBSCRIPTION",
    name: "Kids Membership (Monthly)",
    sessionsIncluded: null,
    commitmentMonths: 12,
    priceInCents: 7500,
  },
  prod_UoHXwBh78aWwYl: {
    planType: "MONTHLY_NSF_6MO",
    category: "MONTHLY_SUBSCRIPTION",
    name: "NSF Membership (Monthly)",
    sessionsIncluded: null,
    commitmentMonths: 6,
    priceInCents: 17500,
  },
};

/**
 * Get plan configuration from Stripe Product ID
 */
export function getPlanFromStripeProduct(
  productId: string,
): StripePlanConfig | null {
  return STRIPE_PRODUCT_TO_PLAN[productId] || null;
}

/**
 * Check if a plan type is subscription-based (unlimited classes)
 */
export function isSubscriptionPlan(planType: MembershipPlanType): boolean {
  return planType.startsWith("MONTHLY_");
}

/**
 * Check if a plan type is flexi package (session-based)
 */
export function isFlexiPlan(planType: MembershipPlanType): boolean {
  return planType.startsWith("FLEXI_");
}

/**
 * Get default flexi expiry in months
 */
export function getFlexiExpiryMonths(config: StripePlanConfig): number {
  return config.flexiExpiryMonths ?? 6;
}
