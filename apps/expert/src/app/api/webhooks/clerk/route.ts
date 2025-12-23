import type { WebhookRequiredHeaders } from "svix";
import { NextRequest } from "next/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";

import { db } from "@adh/db";
import { clerkClient } from "@clerk/nextjs/server";

import { env } from "~/env";

type NextApiRequestWithSvixRequiredHeaders = NextRequest & {
  headers: NextRequest["headers"] & WebhookRequiredHeaders;
};

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

      await tx.clinician.updateMany({
        where: { userId: existingByEmail.id },
        data: { userId: clerkId },
      });

      await tx.user.delete({ where: { id: existingByEmail.id } });
    });
    return true;
  }

  // No existing user to merge; ensure a row exists with Clerk id
  await db.user.upsert({
    where: { id: clerkId },
    update: { email, name: fullName },
    create: { id: clerkId, email, name: fullName },
  });
  return false;
}

export async function POST(req: NextApiRequestWithSvixRequiredHeaders) {
  const svix_id = req.headers.get("svix-id") ?? "";
  const svix_timestamp = req.headers.get("svix-timestamp") ?? "";
  const svix_signature = req.headers.get("svix-signature") ?? "";

  const body = await req.text();

  const sivx = new Webhook(env.CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = sivx.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (e) {
    return new Response(JSON.stringify({ error: e }), { status: 401 });
  }

  if (evt.type === "user.created") {
    const primaryEmailId = evt.data.primary_email_address_id;
    const email = evt.data.email_addresses.find(
      (e) => e.id === primaryEmailId,
    )!.email_address;
    const clerkId = evt.data.id;
    const fullName =
      `${evt.data.first_name ?? ""} ${evt.data.last_name ?? ""}`.trim();
    await mergeUserByEmail(clerkId, email, fullName);
    return new Response("ok", { status: 200 });
  } else if (evt.type === "user.updated") {
    const primaryEmailId = evt.data.primary_email_address_id;
    const email = evt.data.email_addresses.find(
      (e) => e.id === primaryEmailId,
    )!.email_address;
    const clerkId = evt.data.id;
    const fullName =
      `${evt.data.first_name ?? ""} ${evt.data.last_name ?? ""}`.trim();
    await mergeUserByEmail(clerkId, email, fullName);
    return new Response("ok", { status: 200 });
  } else if (evt.type === "session.created") {
    // Fallback: on sign-in, ensure merge happens even if user.created wasn't delivered
    const clerkId = (evt.data as any).user_id as string;
    try {
      const user = await clerkClient.users.getUser(clerkId);
      const email = user.emailAddresses[0]?.emailAddress || "";
      const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
      if (email) {
        await mergeUserByEmail(clerkId, email, fullName);
      }
    } catch {}
    return new Response("ok", { status: 200 });
  } else if (evt.type === "user.deleted") {
    await db.user.delete({
      where: {
        id: evt.data.id,
      },
    });
    return new Response("ok", { status: 200 });
  } else {
    return new Response("not listed event", { status: 400 });
  }
}
