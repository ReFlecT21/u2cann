import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { env as dbEnv } from "@adh/db/env";

export const env = createEnv({
  extends: [dbEnv],
  server: {
    CLERK_PUBLISHABLE_KEY: z.string(),
    CLERK_SECRET_KEY: z.string(),
    AWS_REGION: z.string(),
    S3_ACCESS_KEY_ID: z.string(),
    S3_SECRET_ACCESS_KEY: z.string(),
    S3_BUCKET_NAME: z.string(),
    RESEND_API_KEY: z.string(),
    RAPID_API_KEY: z.string(),
    ZOOMINFO_USERNAME: z.string(),
    ZOOMINFO_PASSWORD: z.string(),
    GOOGLE_TRANSLATE_API_KEY: z.string(),
  },
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
    AWS_REGION: process.env.AWS_REGION,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    RESEND_API_KEY: process.env.RESEND,
    RAPID_API_KEY: process.env.RAPID_API_KEY,
    ZOOMINFO_USERNAME: process.env.ZOOMINFO_USERNAME,
    ZOOMINFO_PASSWORD: process.env.ZOOMINFO_PASSWORD,
    GOOGLE_TRANSLATE_API_KEY:
      process.env.GOOGLE_TRANSLATE_API_KEY,
  },
  skipValidation: process.env.npm_lifecycle_event === "lint",
});
