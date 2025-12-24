import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    PRISMA_URL: z.string(),
  },
  client: {
    NEXT_PUBLIC_NODE_ENV: z
      .enum(["development", "production", "staging"])
      .default("production"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint" ||
    !!process.env.CI,
});
