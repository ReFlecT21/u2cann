import { db } from "@adh/db";
import {
  evaluateAccess,
  type AccessReason,
} from "~/server/services/accessControl";
import {
  isBridgeConfigured,
  restoreAccess,
  revokeAccess,
} from "./hikvisionBridge";
import { decrypt } from "./encryption";

interface ReconcileResult {
  profileId: string;
  userId: string;
  reason: AccessReason;
  /** Whether the cloud's view of camera state matches the desired state. */
  inSync: boolean;
  /** The action we performed (if any) to bring the camera into sync. */
  action: "none" | "granted" | "revoked";
  /** True if the bridge call (when needed) succeeded. */
  ok: boolean;
  error?: string;
}

/**
 * Bring camera state in line with the cloud's access decision for a
 * single user. Idempotent: if the camera already reflects the desired
 * state (per accessGrantedOnCamera), no bridge call is made.
 *
 * Safe to call fire-and-forget from webhooks; never throws.
 */
export async function reconcileUserAccess(
  userId: string,
): Promise<ReconcileResult | null> {
  const profile = await db.faceProfile.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!profile) return null;
  if (profile.approvalStatus !== "APPROVED") {
    // Face isn't on the camera yet; nothing to gate.
    return null;
  }
  // If the profile isn't synced yet, leave it to the normal sync flow.
  if (profile.syncStatus !== "SYNCED") return null;

  let decision;
  try {
    decision = await evaluateAccess(userId);
  } catch (err) {
    console.error("[reconciler] evaluateAccess failed; failing closed", err);
    decision = {
      allowed: false,
      reason: "no_membership" as AccessReason,
      membershipId: null,
      expiresAt: null,
    };
  }

  const shouldBeGranted = decision.allowed;
  const isCurrentlyGranted = profile.accessGrantedOnCamera;

  // Cache the latest reason regardless of action, so admin UI sees it.
  await db.faceProfile.update({
    where: { id: profile.id },
    data: {
      lastAccessReason: decision.reason,
      reconciledAt: new Date(),
    },
  });

  if (shouldBeGranted === isCurrentlyGranted) {
    return {
      profileId: profile.id,
      userId,
      reason: decision.reason,
      inSync: true,
      action: "none",
      ok: true,
    };
  }

  if (!isBridgeConfigured()) {
    return {
      profileId: profile.id,
      userId,
      reason: decision.reason,
      inSync: false,
      action: "none",
      ok: false,
      error: "Bridge not configured",
    };
  }

  const devices = await db.hikvisionDevice.findMany({
    where: { isActive: true },
  });
  if (devices.length === 0) {
    return {
      profileId: profile.id,
      userId,
      reason: decision.reason,
      inSync: false,
      action: "none",
      ok: false,
      error: "No active devices",
    };
  }

  const displayName = profile.user.name || profile.user.email;
  const errors: string[] = [];
  let anyOk = false;

  for (const device of devices) {
    try {
      const password = decrypt(device.encryptedPassword);
      const args = {
        ip: device.ipAddress,
        port: device.port,
        username: device.username,
        password,
        employeeNo: profile.hikvisionEmployeeNo,
        name: displayName,
      };
      const response = shouldBeGranted
        ? await restoreAccess({ ...args, doorRights: [1] })
        : await revokeAccess(args);
      if (response.success) {
        anyOk = true;
      } else {
        errors.push(`${device.name}: ${response.error ?? "unknown"}`);
      }
    } catch (err) {
      errors.push(
        `${device.name}: ${err instanceof Error ? err.message : "exception"}`,
      );
    }
  }

  // Only mark the cloud-side flag flipped when every device succeeded —
  // a partial success means some cameras are out of sync and the next
  // reconciler run will retry the others.
  const allOk = errors.length === 0 && anyOk;
  if (allOk) {
    await db.faceProfile.update({
      where: { id: profile.id },
      data: { accessGrantedOnCamera: shouldBeGranted },
    });
  }

  return {
    profileId: profile.id,
    userId,
    reason: decision.reason,
    inSync: allOk,
    action: shouldBeGranted ? "granted" : "revoked",
    ok: allOk,
    error: errors.length ? errors.join("; ") : undefined,
  };
}

/**
 * Wrapper used from non-critical paths (Stripe webhook). Catches every
 * error so the caller can fire-and-forget without breaking its response.
 */
export function reconcileUserAccessSafe(userId: string): Promise<void> {
  return reconcileUserAccess(userId)
    .then((r) => {
      if (r) {
        console.log(
          `[reconciler] user=${userId} reason=${r.reason} action=${r.action} ok=${r.ok}`,
        );
      }
    })
    .catch((err) => {
      console.error(`[reconciler] user=${userId} failed`, err);
    });
}

/**
 * Reconcile every approved+synced face profile. Used by the Vercel cron.
 * Processes serially to avoid hammering the camera or the bridge.
 */
export async function reconcileAllAccess(): Promise<{
  total: number;
  changed: number;
  failed: number;
}> {
  const profiles = await db.faceProfile.findMany({
    where: {
      approvalStatus: "APPROVED",
      syncStatus: "SYNCED",
    },
    select: { userId: true },
  });

  let changed = 0;
  let failed = 0;
  for (const p of profiles) {
    try {
      const r = await reconcileUserAccess(p.userId);
      if (r && r.action !== "none") {
        if (r.ok) changed += 1;
        else failed += 1;
      }
    } catch (err) {
      console.error("[reconciler] unexpected error", err);
      failed += 1;
    }
  }
  return { total: profiles.length, changed, failed };
}
