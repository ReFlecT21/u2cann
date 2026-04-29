import { type NextRequest, NextResponse } from "next/server";
import { db } from "@adh/db";

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
  const decision: "GRANTED" | "DENIED" | "UNKNOWN" = userId
    ? "GRANTED"
    : employeeNo
      ? "DENIED"
      : "UNKNOWN";

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
    },
  });

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "hikvision-webhook" });
}
