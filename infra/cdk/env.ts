// filepath: /c:/Users/guru/Documents/GitHub/adh/infra/cdk/env.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { env as dbEnv } from "@adh/db/env";
import { env as expertEnv } from "@adh/expert/env";

export const applicationEnv = createEnv({
  extends: [dbEnv, expertEnv],
  runtimeEnv: {
    ...process.env,
  },
});

export const env = createEnv({
  extends: [applicationEnv],
  server: {
    CDK_DEFAULT_ACCOUNT: z.string(),
    CDK_DEFAULT_REGION: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    NEXT_PUBLIC_CDK_ENVIRONMENT: z
      .enum(["development", "production"])
      .default("production"),
    PRISMA_URL: z.string(), // Add PRISMA_URL here
  },
  runtimeEnv: {
    ...process.env,
    CDK_DEFAULT_ACCOUNT: process.env.CDK_DEFAULT_ACCOUNT,
    CDK_DEFAULT_REGION: process.env.CDK_DEFAULT_REGION,
    NEXT_PUBLIC_CDK_ENVIRONMENT: process.env.NEXT_PUBLIC_CDK_ENVIRONMENT,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    PRISMA_URL: process.env.PRISMA_URL, // Add PRISMA_URL here
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RAPID_API_KEY: process.env.RAPID_API_KEY,
    ZOOMINFO_USERNAME: process.env.ZOOMINFO_USERNAME,
    ZOOMINFO_PASSWORD: process.env.ZOOMINFO_PASSWORD,
    GOOGLE_TRANSLATE_API_KEY:
      process.env.GOOGLE_TRANSLATE_API_KEY,
  },
  skipValidation: process.env.npm_lifecycle_event === "lint",
});
