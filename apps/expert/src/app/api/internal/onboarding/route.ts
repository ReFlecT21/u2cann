import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@adh/db";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ needsSetup: true }, { status: 401 });

  // Try by id first
  let user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, teamId: true },
  });

  if (!user) {
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (email) {
        user = await db.user.findUnique({
          where: { email },
          select: { id: true, email: true, role: true, teamId: true },
        });
      }
    } catch {
      // ignore
    }
  }

  // If no user row exists yet, force setup (will be created by webhook soon)
  if (!user) return NextResponse.json({ needsSetup: true });

  // Require admins to have a team created
  const needsSetup = user.role === "admin" && !user.teamId;

  return NextResponse.json({ needsSetup });
}
