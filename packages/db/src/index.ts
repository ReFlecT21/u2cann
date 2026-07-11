import * as Prisma from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

import { env } from "../env";

const createPrismaClient = () => {
  // Production (e.g. Vercel serverless): use the plain pooled Postgres
  // connection. It's reliable in the datacenter and avoids the Neon serverless
  // WebSocket driver's "Connection terminated unexpectedly" errors when a
  // serverless function is frozen/thawed between invocations. Prod never had
  // the local connect/pool-timeout problem the serverless driver was added for.
  if (env.NEXT_PUBLIC_NODE_ENV === "production") {
    return new Prisma.PrismaClient({ log: ["error"] });
  }

  // Local dev only: Neon's serverless driver speaks Postgres over a WebSocket on
  // port 443, dodging the connect/pool timeouts that high-latency networks (and
  // the WARP US-detour) trip on the raw 5432 connection. See
  // docs/neon-serverless-db-fix.md. Prefer Node's built-in WebSocket (Node 22+):
  // the `ws` package breaks when webpack bundles it ("bufferUtil.mask is not a
  // function"), which killed dev DB connections. `ws` stays as a fallback for
  // older Node runtimes only.
  neonConfig.webSocketConstructor =
    (globalThis as unknown as { WebSocket?: typeof ws }).WebSocket ?? ws;
  const url = new URL(env.PRISMA_URL);
  // Strip Prisma-only query params the pg-style parser doesn't accept.
  url.searchParams.delete("pool_timeout");
  url.searchParams.delete("connect_timeout");
  const pool = new Pool({ connectionString: url.toString() });

  return new Prisma.PrismaClient({
    adapter: new PrismaNeon(pool),
    log: ["error", "warn"],
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
