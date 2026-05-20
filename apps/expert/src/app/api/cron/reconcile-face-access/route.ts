import { type NextRequest, NextResponse } from "next/server";
import { reconcileAllAccess } from "~/server/lib/accessReconciler";

// Vercel cron route. Auth uses the Authorization header that Vercel
// injects when CRON_SECRET is set on the project. Local invocation
// for testing: send the same Bearer token.
export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // No secret set — allow unauthenticated calls. In prod always set
    // CRON_SECRET; this fallback exists so local dev doesn't break.
    return true;
  }
  const got = request.headers.get("authorization");
  return got === `Bearer ${expected}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    const result = await reconcileAllAccess();
    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      ...result,
    });
  } catch (err) {
    console.error("[cron/reconcile-face-access] failed", err);
    return NextResponse.json(
      {
        ok: false,
        durationMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : "Unknown",
      },
      { status: 500 },
    );
  }
}

// Vercel cron uses GET; expose POST too so manual triggers from the
// admin UI or curl can use either verb.
export const POST = GET;
