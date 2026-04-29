import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env";

const region = env.AWS_REGION ?? "ap-southeast-1";

export const s3Client = new S3Client({
  region,
  credentials:
    env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export interface UploadResult {
  url: string;
  key: string;
}

export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<UploadResult> {
  if (!env.S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  const url = `https://${env.S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
  return { url, key };
}

export async function deleteFromS3(key: string): Promise<void> {
  if (!env.S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
    }),
  );
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresInSeconds = 300,
): Promise<string> {
  if (!env.S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn: expiresInSeconds },
  );
}
