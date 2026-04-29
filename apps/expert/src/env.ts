import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { env as dbEnv } from "@adh/db/env";

export const env = createEnv({
  extends: [dbEnv],
  server: {
    CLERK_SECRET_KEY: z.string(),
    AWS_REGION: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET_NAME: z.string().optional(),
    CLERK_WEBHOOK_SECRET: z.string(),
    RESEND_API_KEY: z.string().optional(),
    RAPID_API_KEY: z.string().optional(),
    ZOOMINFO_USERNAME: z.string().optional(),
    ZOOMINFO_PASSWORD: z.string().optional(),
    GOOGLE_TRANSLATE_API_KEY: z.string().optional(),
    // Stripe (optional until configured)
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    // Hikvision bridge (optional until deployed)
    HIKVISION_BRIDGE_URL: z.string().optional(),
    HIKVISION_BRIDGE_SECRET: z.string().optional(),
    HIKVISION_ENCRYPTION_KEY: z.string().optional(),
    NEXT_PUBLIC_CDK_ENVIRONMENT: z
      .enum(["development", "production"])
      .default("production"),
  },
  client: {
    NEXT_PUBLIC_BASE_DOMAIN: z.string(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string(),
    // Stripe publishable key (optional until configured)
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  },
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    AWS_REGION: process.env.AWS_REGION,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    NEXT_PUBLIC_BASE_DOMAIN: process.env.NEXT_PUBLIC_BASE_DOMAIN,
    NEXT_PUBLIC_CDK_ENVIRONMENT: process.env.NEXT_PUBLIC_CDK_ENVIRONMENT,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RAPID_API_KEY: process.env.RAPID_API_KEY,
    ZOOMINFO_USERNAME: process.env.ZOOMINFO_USERNAME,
    ZOOMINFO_PASSWORD: process.env.ZOOMINFO_PASSWORD,
    GOOGLE_TRANSLATE_API_KEY:
      process.env.GOOGLE_TRANSLATE_API_KEY,
    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    // Hikvision bridge
    HIKVISION_BRIDGE_URL: process.env.HIKVISION_BRIDGE_URL,
    HIKVISION_BRIDGE_SECRET: process.env.HIKVISION_BRIDGE_SECRET,
    HIKVISION_ENCRYPTION_KEY: process.env.HIKVISION_ENCRYPTION_KEY,
  },
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint" ||
    !!process.env.CI,
});
