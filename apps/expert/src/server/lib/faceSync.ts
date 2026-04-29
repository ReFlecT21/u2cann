import { db } from "@adh/db";
import { decrypt } from "./encryption";
import { getPresignedDownloadUrl } from "./s3";
import {
  deleteFace,
  describeError,
  isBridgeConfigured,
  syncFace,
  type BridgeResponse,
} from "./hikvisionBridge";

interface SyncResult {
  deviceId: string;
  deviceName: string;
  success: boolean;
  error?: string;
}

async function getActiveDevices() {
  return db.hikvisionDevice.findMany({
    where: { isActive: true },
  });
}

export async function syncFaceProfile(profileId: string): Promise<{
  ok: boolean;
  results: SyncResult[];
  skipped?: string;
}> {
  if (!isBridgeConfigured()) {
    return {
      ok: false,
      results: [],
      skipped: "Bridge not configured (HIKVISION_BRIDGE_URL/SECRET missing)",
    };
  }

  const profile = await db.faceProfile.findUnique({
    where: { id: profileId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!profile) {
    return { ok: false, results: [], skipped: "Profile not found" };
  }
  if (profile.approvalStatus !== "APPROVED") {
    return { ok: false, results: [], skipped: "Profile not approved" };
  }

  const devices = await getActiveDevices();
  if (devices.length === 0) {
    return { ok: false, results: [], skipped: "No active devices configured" };
  }

  await db.faceProfile.update({
    where: { id: profile.id },
    data: { syncStatus: "SYNCING", syncError: null },
  });

  const displayName = profile.user.name || profile.user.email;
  // Generate a short-lived presigned URL so the bridge can download the
  // image even from a private bucket. Falls back to the raw URL if the
  // S3 key isn't recorded for some reason.
  let imageUrl = profile.faceImageUrl;
  if (profile.faceImageS3Key) {
    try {
      imageUrl = await getPresignedDownloadUrl(profile.faceImageS3Key, 300);
    } catch (err) {
      console.error("[faceSync] failed to presign URL, using raw", err);
    }
  }
  const results: SyncResult[] = [];

  for (const device of devices) {
    let response: BridgeResponse;
    try {
      const password = decrypt(device.encryptedPassword);
      // Delete first so re-syncs are idempotent (camera errors with
      // employeeNoAlreadyExist if the person already exists). Ignore
      // delete failures — they're expected when the person isn't there yet.
      await deleteFace({
        ip: device.ipAddress,
        port: device.port,
        username: device.username,
        password,
        employeeNo: profile.hikvisionEmployeeNo,
      }).catch(() => undefined);

      response = await syncFace({
        ip: device.ipAddress,
        port: device.port,
        username: device.username,
        password,
        employeeNo: profile.hikvisionEmployeeNo,
        name: displayName,
        faceImageUrl: imageUrl,
        doorRights: [1],
      });
    } catch (err) {
      response = {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
    results.push({
      deviceId: device.id,
      deviceName: device.name,
      success: response.success,
      error: response.success ? undefined : describeError(response),
    });

    if (response.success) {
      await db.hikvisionDevice.update({
        where: { id: device.id },
        data: { lastSyncedAt: new Date() },
      });
    }
  }

  const allOk = results.every((r) => r.success);
  await db.faceProfile.update({
    where: { id: profile.id },
    data: {
      syncStatus: allOk ? "SYNCED" : "FAILED",
      syncError: allOk
        ? null
        : results
            .filter((r) => !r.success)
            .map((r) => `${r.deviceName}: ${r.error ?? "unknown error"}`)
            .join("; "),
      syncedAt: allOk ? new Date() : null,
    },
  });

  return { ok: allOk, results };
}

export async function removeFaceFromDevices(
  employeeNo: string,
): Promise<SyncResult[]> {
  if (!isBridgeConfigured()) return [];

  const devices = await getActiveDevices();
  const results: SyncResult[] = [];

  for (const device of devices) {
    let response: BridgeResponse;
    try {
      const password = decrypt(device.encryptedPassword);
      response = await deleteFace({
        ip: device.ipAddress,
        port: device.port,
        username: device.username,
        password,
        employeeNo,
      });
    } catch (err) {
      response = {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
    results.push({
      deviceId: device.id,
      deviceName: device.name,
      success: response.success,
      error: response.success ? undefined : describeError(response),
    });
  }

  return results;
}
