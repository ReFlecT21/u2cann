import { type NextRequest, NextResponse } from "next/server";
import { db } from "@adh/db";
import {
  evaluateAccess,
  isAllowedReason,
  type AccessReason,
} from "~/server/services/accessControl";
import { sendAccessDeniedEmail } from "~/server/services/emailService";

// Hikvision face terminals POST recognition events here.
// Configure on the camera: Event → Notification → HTTP, URL = this endpoint.
// Body shape varies by firmware (JSON or XML). We capture the raw payload
// and best-effort parse the common fields.

interface HikvisionEventPayload {
  eventType?: number | string;
  employeeNoString?: string;
  employeeNo?: string | number;
  name?: string;
  dateTime?: string;
  faceRect?: unknown;
  similarity?: number;
  picUrl?: string;
  // Newer firmware nests under AccessControllerEvent
  AccessControllerEvent?: {
    employeeNoString?: string;
    name?: string;
    similarity?: number;
    picUrl?: string;
    eventType?: number | string;
  };
}

function pickEmployeeNo(p: HikvisionEventPayload): string | null {
  const fromTop = p.employeeNoString || p.employeeNo;
  const fromNested = p.AccessControllerEvent?.employeeNoString;
  const v = fromNested || fromTop;
  return v ? String(v) : null;
}

function pickName(p: HikvisionEventPayload): string | null {
  return p.AccessControllerEvent?.name || p.name || null;
}

function pickSimilarity(p: HikvisionEventPayload): number | null {
  const v = p.AccessControllerEvent?.similarity ?? p.similarity;
  return typeof v === "number" ? v : null;
}

function pickEventType(p: HikvisionEventPayload): string | null {
  const v = p.AccessControllerEvent?.eventType ?? p.eventType;
  return v != null ? String(v) : null;
}

function pickPicUrl(p: HikvisionEventPayload): string | null {
  return p.AccessControllerEvent?.picUrl || p.picUrl || null;
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      raw = await request.json();
    } else {
      // XML or multipart — store as text for now
      const text = await request.text();
      raw = { _raw: text };
    }
  } catch (err) {
    console.error("[hikvision-webhook] failed to parse body", err);
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const payload = raw as HikvisionEventPayload;
  const employeeNo = pickEmployeeNo(payload);
  const userName = pickName(payload);
  const similarity = pickSimilarity(payload);
  const eventType = pickEventType(payload);
  const capturedImageUrl = pickPicUrl(payload);

  // Try to resolve our user from the employee number
  let userId: string | null = null;
  if (employeeNo) {
    const profile = await db.faceProfile.findUnique({
      where: { hikvisionEmployeeNo: employeeNo },
      select: { userId: true },
    });
    userId = profile?.userId ?? null;
  }

  // Hikvision event type 5 / 75 typically = face recognition success.
  // Anything explicitly marked failed counts as DENIED. Keep loose for now.
  const cameraDecision: "GRANTED" | "DENIED" | "UNKNOWN" = userId
    ? "GRANTED"
    : employeeNo
      ? "DENIED"
      : "UNKNOWN";

  // Independent server-side judgement of whether this user *should*
  // have been granted access. Stored alongside the camera's decision
  // so we can see when the two disagree (e.g. camera granted because
  // we haven't pushed a revoke yet, but cloud knows membership lapsed).
  let serverReason: AccessReason | null = null;
  if (userId) {
    try {
      const access = await evaluateAccess(userId);
      serverReason = access.reason;
    } catch (err) {
      console.error("[hikvision-webhook] evaluateAccess failed", err);
    }
  }

  await db.accessEvent.create({
    data: {
      employeeNo,
      userId,
      userName,
      eventType,
      decision: cameraDecision,
      similarity,
      capturedImageUrl,
      rawPayload: raw as never,
      membershipStateAtScan: serverReason,
    },
  });

  // Notify the member if they were denied AND we know who they are.
  // Throttle: at most one email per 24h per membership row
  // (tracked via UserMembership.lastAccessNotifiedAt).
  if (
    cameraDecision === "DENIED" &&
    userId &&
    serverReason &&
    !isAllowedReason(serverReason)
  ) {
    void notifyDeniedAccess(userId, serverReason);
  }

  return NextResponse.json({ received: true });
}

async function notifyDeniedAccess(userId: string, reason: AccessReason) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, name: true },
    });
    if (!user?.email) return;

    // Find the most recently-touched membership row to throttle against.
    // (If the user has no memberships at all, fall back to a 24h check
    // on the most recent denied AccessEvent.)
    const membership = await db.userMembership.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (membership) {
      if (
        membership.lastAccessNotifiedAt &&
        membership.lastAccessNotifiedAt > dayAgo
      ) {
        return; // already notified in last 24h
      }
      await db.userMembership.update({
        where: { id: membership.id },
        data: { lastAccessNotifiedAt: now },
      });
    } else {
      // No membership row — use AccessEvent history as the throttle.
      const recentNotified = await db.accessEvent.findFirst({
        where: {
          userId,
          decision: "DENIED",
          createdAt: { gt: dayAgo },
        },
        orderBy: { createdAt: "desc" },
      });
      // The current event we just inserted will match too, so we need
      // to look for >1 row in that window.
      const count = await db.accessEvent.count({
        where: {
          userId,
          decision: "DENIED",
          createdAt: { gt: dayAgo },
        },
      });
      if (recentNotified && count > 1) return;
    }

    const firstName =
      user.firstName ?? user.name?.split(" ")[0] ?? null;

    await sendAccessDeniedEmail({
      to: user.email,
      firstName,
      reason,
      deviceName: null,
      occurredAt: now,
    });
  } catch (err) {
    console.error("[hikvision-webhook] notifyDeniedAccess failed", err);
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "hikvision-webhook" });
}
