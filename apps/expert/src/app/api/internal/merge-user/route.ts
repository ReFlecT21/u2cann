import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@adh/db";

async function mergeUserByEmail(
  clerkId: string,
  email: string,
  fullName: string,
) {
  const existingByEmail = await db.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, role: true, teamId: true },
  });

  if (existingByEmail && existingByEmail.id !== clerkId) {
    await db.$transaction(async (tx) => {
      // Temporarily free the unique email on the placeholder row
      const tempEmail = `migrating+${Date.now()}@placeholder.local`;
      await tx.user.update({
        where: { id: existingByEmail.id },
        data: { email: tempEmail },
      });

      // Upsert the Clerk-id row with the real email
      await tx.user.upsert({
        where: { id: clerkId },
        update: {
          email,
          name: fullName,
          role: existingByEmail.role,
          teamId: existingByEmail.teamId ?? undefined,
        },
        create: {
          id: clerkId,
          email,
          name: fullName,
          role: existingByEmail.role,
          teamId: existingByEmail.teamId ?? undefined,
        },
      });

      // Re-point relations and delete placeholder
      await tx.clinician.updateMany({
        where: { userId: existingByEmail.id },
        data: { userId: clerkId },
      });
      await tx.user.delete({ where: { id: existingByEmail.id } });
    });
    return true;
  }

  await db.user.upsert({
    where: { id: clerkId },
    update: { email, name: fullName },
    create: { id: clerkId, email, name: fullName },
  });
  return false;
}

export async function POST() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ merged: false }, { status: 401 });
  const user = await clerkClient.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress || "";
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (!email) return NextResponse.json({ merged: false }, { status: 200 });
  const merged = await mergeUserByEmail(userId, email, fullName);
  return NextResponse.json({ merged });
}
