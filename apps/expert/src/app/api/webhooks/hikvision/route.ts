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
  // Firmware nests the real data under AccessControllerEvent
  AccessControllerEvent?: {
    employeeNoString?: string;
    name?: string;
    similarity?: number;
    picUrl?: string;
    eventType?: number | string;
    majorEventType?: number;
    subEventType?: number;
    currentVerifyMode?: string;
    statusValue?: number;
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
    } else if (contentType.includes("multipart/form-data")) {
      // The terminal posts multipart with an "event_log" part (JSON) plus
      // an optional binary picture part. Pull the event JSON out.
      const form = await request.formData();
      const eventLog = form.get("event_log");
      if (typeof eventLog === "string") {
        try {
          raw = JSON.parse(eventLog);
        } catch {
          raw = { _raw: eventLog };
        }
      } else {
        // Some firmware names the field differently; fall back to the
        // first string part that looks like JSON.
        let found: unknown = null;
        for (const [, value] of form.entries()) {
          if (typeof value === "string" && value.trim().startsWith("{")) {
            try {
              found = JSON.parse(value);
              break;
            } catch {
              // keep looking
            }
          }
        }
        raw = found ?? { _unparsed: "multipart without event_log" };
      }
    } else {
      // XML or unknown — try JSON, else store raw text
      const text = await request.text();
      try {
        raw = JSON.parse(text);
      } catch {
        raw = { _raw: text };
      }
    }
  } catch (err) {
    console.error("[hikvision-webhook] failed to parse body", err);
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const payload = raw as HikvisionEventPayload;
  const employeeNo = pickEmployeeNo(payload);

  // The terminal emits a lot of door/system noise (no person attached).
  // We only care about events where a known person scanned, so skip the
  // rest to keep the access log clean and avoid email noise.
  if (!employeeNo) {
    return NextResponse.json({ received: true, skipped: "no employeeNo" });
  }

  const userName = pickName(payload);
  const similarity = pickSimilarity(payload);
  const eventType = pickEventType(payload);
  const capturedImageUrl = pickPicUrl(payload);

  // Resolve our user from the employee number
  const profile = await db.faceProfile.findUnique({
    where: { hikvisionEmployeeNo: employeeNo },
    select: { userId: true },
  });
  const userId = profile?.userId ?? null;

  // The cloud's own access decision is authoritative — we can't reliably
  // map this firmware's grant/deny event codes, and the reconciler keeps
  // the camera in lockstep with this anyway. So the effective decision and
  // the denial email are both driven by evaluateAccess, not camera codes.
  let serverReason: AccessReason | null = null;
  if (userId) {
    try {
      const access = await evaluateAccess(userId);
      serverReason = access.reason;
    } catch (err) {
      console.error("[hikvision-webhook] evaluateAccess failed", err);
    }
  }

  const decision: "GRANTED" | "DENIED" | "UNKNOWN" =
    serverReason == null
      ? "UNKNOWN"
      : isAllowedReason(serverReason)
        ? "GRANTED"
        : "DENIED";

  await db.accessEvent.create({
    data: {
      employeeNo,
      userId,
      userName,
      eventType,
      decision,
      similarity,
      capturedImageUrl,
      rawPayload: raw as never,
      membershipStateAtScan: serverReason,
    },
  });

  // Notify the member if the cloud says they shouldn't have access.
  // Throttle: at most one email per 24h per membership row.
  if (
    decision === "DENIED" &&
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
