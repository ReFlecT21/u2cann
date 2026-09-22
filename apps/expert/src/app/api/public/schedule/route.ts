import { NextResponse } from "next/server";
import { db } from "@adh/db";

/**
 * Public weekly class timetable, consumed by the marketing website
 * (u2can-website) to render its Schedule page.
 *
 * Source of truth is the ACTIVE class templates — the recurring weekly
 * pattern — so editing the schedule in the admin app updates the website
 * automatically. Open-gym / personal-training blocks are excluded: the
 * website advertises bookable classes only.
 *
 * CORS is open because this is public, read-only marketing data.
 */

export const dynamic = "force-dynamic";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// Monday first, Sunday last — how the gym reads its own week.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** "07:15" -> "7:15AM", "17:15" -> "5:15PM", "12:00" -> "12PM" */
function to12Hour(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr) || 0;
  const m = Number(mStr) || 0;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}${suffix}` : `${hour12}:${String(m).padStart(2, "0")}${suffix}`;
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  try {
    const templates = await db.classTemplate.findMany({
      where: { isActive: true, classType: { isOpenGym: false } },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        capacity: true,
        classType: { select: { displayName: true, color: true, duration: true } },
        instructor: { select: { name: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    const days = DISPLAY_ORDER.map((dow) => ({
      dayOfWeek: dow,
      day: DAY_NAMES[dow],
      classes: templates
        .filter((t) => t.dayOfWeek === dow)
        .map((t) => ({
          id: t.id,
          name: t.classType.displayName.trim(),
          startTime: t.startTime,
          endTime: t.endTime,
          // Pre-formatted for display, e.g. "7:15AM - 8AM"
          timeLabel: `${to12Hour(t.startTime)} - ${to12Hour(t.endTime)}`,
          color: t.classType.color,
          instructor: t.instructor?.name ?? null,
          capacity: t.capacity,
        })),
    }));

    return NextResponse.json(
      { updatedAt: new Date().toISOString(), days },
      {
        headers: {
          ...CORS,
          // Cheap CDN cache; schedule changes propagate within a minute.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("[api/public/schedule] failed", error);
    return NextResponse.json(
      { error: "Could not load schedule" },
      { status: 500, headers: CORS },
    );
  }
}
