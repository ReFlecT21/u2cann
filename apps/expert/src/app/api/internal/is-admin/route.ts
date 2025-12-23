import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@adh/db";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ isAdmin: false }, { status: 401 });

  // Try DB by Clerk id first
  let user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });

  // Fallback to lookup by email (in case of id mismatch)
  if (!user) {
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (email) {
        user = await db.user.findUnique({
          where: { email },
          select: { role: true, email: true },
        });
      }
    } catch {}
  }

  return NextResponse.json({ isAdmin: user?.role === "admin" });
}
