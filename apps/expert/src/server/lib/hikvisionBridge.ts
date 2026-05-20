import { env } from "~/env";

export interface BridgeDevice {
  ip: string;
  port: number;
  username: string;
  password: string;
}

export interface SyncFaceArgs extends BridgeDevice {
  employeeNo: string;
  name: string;
  faceImageUrl: string;
  doorRights?: number[];
}

export interface DeleteFaceArgs extends BridgeDevice {
  employeeNo: string;
}

export interface RevokeAccessArgs extends BridgeDevice {
  employeeNo: string;
  name: string;
}

export interface RestoreAccessArgs extends BridgeDevice {
  employeeNo: string;
  name: string;
  doorRights?: number[];
}

export interface BridgeResponse {
  success: boolean;
  error?: string;
  message?: string;
  step?: string;
  details?: unknown;
}

function describeError(r: BridgeResponse): string {
  const parts: string[] = [];
  if (r.step) parts.push(`step=${r.step}`);
  if (r.error) parts.push(r.error);
  if (r.details && typeof r.details === "string") parts.push(r.details);
  if (r.details && typeof r.details === "object") {
    try {
      parts.push(JSON.stringify(r.details));
    } catch {
      // ignore
    }
  }
  return parts.length ? parts.join(" — ") : "Unknown error";
}

export { describeError };

function getBridgeConfig() {
  if (!env.HIKVISION_BRIDGE_URL || !env.HIKVISION_BRIDGE_SECRET) {
    return null;
  }
  return {
    url: env.HIKVISION_BRIDGE_URL.replace(/\/$/, ""),
    secret: env.HIKVISION_BRIDGE_SECRET,
  };
}

export function isBridgeConfigured(): boolean {
  return getBridgeConfig() !== null;
}

async function callBridge<T extends BridgeResponse>(
  path: string,
  body: object,
): Promise<T> {
  const cfg = getBridgeConfig();
  if (!cfg) {
    return {
      success: false,
      error: "Hikvision bridge not configured (missing HIKVISION_BRIDGE_URL/SECRET)",
    } as T;
  }

  try {
    const res = await fetch(`${cfg.url}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.secret}`,
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json().catch(() => null)) as T | null;
    if (!json) {
      return {
        success: false,
        error: `Bridge returned non-JSON response (status ${res.status})`,
      } as T;
    }
    return json;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Bridge request failed",
    } as T;
  }
}

export function syncFace(args: SyncFaceArgs) {
  return callBridge<BridgeResponse>("/api/hikvision/sync-face", args);
}

export function deleteFace(args: DeleteFaceArgs) {
  return callBridge<BridgeResponse>("/api/hikvision/delete-face", args);
}

export function revokeAccess(args: RevokeAccessArgs) {
  return callBridge<BridgeResponse>("/api/hikvision/revoke-access", args);
}

export function restoreAccess(args: RestoreAccessArgs) {
  return callBridge<BridgeResponse>("/api/hikvision/restore-access", args);
}

export function testConnection(args: BridgeDevice) {
  return callBridge<BridgeResponse>("/api/hikvision/test", args);
}
