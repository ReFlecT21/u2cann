import * as Prisma from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

import { env } from "../env";

// Neon's serverless driver speaks Postgres over a WebSocket on port 443. This
// sidesteps networks that block outbound 5432 *and* the WARP-detour latency
// that tripped Prisma's connect/pool timeouts on local dev. In a Node runtime
// we have to hand it a WebSocket implementation (browsers provide their own).
neonConfig.webSocketConstructor = ws;

const createPrismaClient = () => {
  // The connection string carries a couple of Prisma-only query params
  // (pool_timeout / connect_timeout) that the pg-style parser doesn't accept —
  // strip them before handing the URL to the Neon pool.
  const url = new URL(env.PRISMA_URL);
  url.searchParams.delete("pool_timeout");
  url.searchParams.delete("connect_timeout");

  const pool = new Pool({ connectionString: url.toString() });
  const adapter = new PrismaNeon(pool);

  return new Prisma.PrismaClient({
    adapter,
    log:
      env.NEXT_PUBLIC_NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NEXT_PUBLIC_NODE_ENV !== "production") globalForPrisma.prisma = db;

export { Prisma };

// Export enums for use in the application
export {
  Role,
  BookingStatus,
  MembershipPlanType,
  MembershipCategory,
  MembershipStatus,
} from "@prisma/client";
