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

// tier → Stripe prices. `recurringPrice` is the monthly subscription price (first
// charge on the 1st); `oneTimePrice` is the same amount as a one-time price,
// charged at signup to cover the current month in full.
// TODO(go-live): replace these TEST price IDs with the LIVE price IDs.
const TIERS: Record<
  string,
  { recurringPrice: string; oneTimePrice: string; label: string }
> = {
  adult_175: { recurringPrice: "price_1Tjjm7F5WGAAdASV0n7J0PB5", oneTimePrice: "price_1Tk5HXF5WGAAdASVZqQh6h3u", label: "Adult $175/mo" },
  adult_190: { recurringPrice: "price_1Tjjm9F5WGAAdASVW7gqNFW5", oneTimePrice: "price_1Tk5HYF5WGAAdASVQRdLxzcT", label: "Adult $190/mo" },
  student_98: { recurringPrice: "price_1TjjmBF5WGAAdASVBomXs5WY", oneTimePrice: "price_1Tk5HYF5WGAAdASVEoWF88Ut", label: "Student $98/mo" },
  mt_student_128: { recurringPrice: "price_1TjjmDF5WGAAdASV1ajRR7MS", oneTimePrice: "price_1Tk5HZF5WGAAdASVtcqpE3tb", label: "Muay Thai Student $128/mo" },
  kids_75: { recurringPrice: "price_1TjjmFF5WGAAdASVg2UMng5O", oneTimePrice: "price_1Tk5HZF5WGAAdASVHuQKCKUa", label: "Kids $75/mo" },
  nsf_175: { recurringPrice: "price_1Tjk9BF5WGAAdASViGTJpsbw", oneTimePrice: "price_1Tk5HaF5WGAAdASVKDgAg2nV", label: "NSF $175/mo" },
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
        subscription_data: {
          billing_cycle_anchor: nextMonthStartUnix(),
          proration_behavior: "none",
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
