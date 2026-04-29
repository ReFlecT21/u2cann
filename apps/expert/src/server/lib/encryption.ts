import crypto from "crypto";
import { env } from "~/env";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;

function getKey(): Buffer {
  const key = env.HIKVISION_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "HIKVISION_ENCRYPTION_KEY is not configured — required to store device passwords",
    );
  }
  // Accept either 64-char hex (32 bytes) or any string we hash to 32 bytes
  if (/^[a-f0-9]{64}$/i.test(key)) return Buffer.from(key, "hex");
  return crypto.createHash("sha256").update(key).digest();
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), enc.toString("hex")].join(":");
}

export function decrypt(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Invalid encrypted payload");
  }
  const decipher = crypto.createDecipheriv(
    ALGO,
    getKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}
