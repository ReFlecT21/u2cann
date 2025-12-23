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
  },
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
    AWS_REGION: process.env.AWS_REGION,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  },
  skipValidation: process.env.npm_lifecycle_event === "lint",
});
