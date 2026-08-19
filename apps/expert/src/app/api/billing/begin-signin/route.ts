import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * First step of the account-first billing flow (/billing/start).
 *
 * Ensures a Clerk account exists for the given email so the client can run
 * the standard email-OTP sign-IN flow regardless of whether the member is new
 * or returning (and regardless of the instance's sign-up restrictions — user
 * creation happens server-side, exactly like the Stripe webhook does it).
 *
 * The email is only ever usable by whoever can read the OTP sent to it, so
 * creating the account here grants nothing by itself.
 */
export async function POST(req: NextRequest) {
  let email: unknown;
  try {
    ({ email } = (await req.json()) as { email?: unknown });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const normalized = email.trim().toLowerCase();

  try {
    const client = await clerkClient();
    const existing = await client.users.getUserList({ emailAddress: [normalized] });
    if (existing.totalCount === 0) {
      await client.users.createUser({
        emailAddress: [normalized],
        skipPasswordRequirement: true, // OTP sign-in, same as webhook-created users
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[billing/begin-signin] failed", e);
    return NextResponse.json({ error: "Could not prepare sign-in" }, { status: 500 });
  }
}
