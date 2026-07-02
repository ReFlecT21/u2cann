# Permanent DB fix — Neon serverless driver

**Date:** 2026-06-20
**Scope:** local dev (and a small win for prod). Switches `packages/db` from the
raw Postgres TCP connection (port 5432) to **Neon's serverless driver**, which
speaks Postgres over a **WebSocket on port 443**.

---

## Symptom

On certain networks the Next dev server's webhook (and any Prisma call) failed
with 500s like:

```
Can't reach database server at ep-…-pooler.ap-southeast-1.aws.neon.tech:5432
```
and later, once routed around that:
```
Timed out fetching a new connection from the connection pool.
(Current connection pool timeout: 10, connection limit: 23)
POST /api/webhooks/stripe 500 in 10619ms
```

It worked on some networks and not others, and was flaky even when it "worked".

---

## Root cause

Two stacked problems:

1. **Slow initial Postgres connect over 5432.** The Neon connection took several
   seconds to establish (cross-region latency + Neon serverless compute
   cold-start). Prisma's defaults are **`connect_timeout` = 5s** and
   **`pool_timeout` = 10s**, so the query gave up *before* the connection was
   ready and reported the DB as unreachable.

2. **Cloudflare WARP made it dramatically worse.** WARP had been turned on to
   "bypass a port-5432 block", but on this network 5432 wasn't actually blocked —
   and WARP's exit lands in the **US (LAX)**, adding a detour that pushed the
   connect to **~13–30s**, which blew past every timeout.

So the real issue was *connection latency tripping Prisma's timeouts*, amplified
by WARP — **not** a hard port block.

---

## The fix

Switched the Prisma client to **Neon's serverless driver** (`@prisma/adapter-neon`
+ `@neondatabase/serverless`). It tunnels Postgres over a **WebSocket on 443**:

- **443 is open on virtually every network** → no port-5432 dependency.
- **WARP is no longer needed** (it was the main latency source) and should stay
  **off** — the DB is faster without it.
- Connects reliably without tripping the connect/pool timeouts.

### Changes

1. **`packages/db/prisma/schema.prisma`** — enable the preview feature on the
   generator:
   ```prisma
   generator client {
     provider        = "prisma-client-js"
     binaryTargets   = ["native", "linux-musl", "rhel-openssl-1.1.x"]
     engineType      = "library"
     previewFeatures = ["driverAdapters"]
   }
   ```

2. **Dependencies** (in `packages/db`):
   ```bash
   pnpm --filter @adh/db add @prisma/adapter-neon@5.19.1 @neondatabase/serverless
   pnpm --filter @adh/db add -D @types/ws
   ```
   `@prisma/adapter-neon` is **pinned to 5.19.1 to match Prisma/`@prisma/client`
   5.19.1**. `ws` was already present.

3. **`packages/db/src/index.ts`** — build the client with the adapter:
   ```ts
   import * as Prisma from "@prisma/client";
   import { PrismaNeon } from "@prisma/adapter-neon";
   import { Pool, neonConfig } from "@neondatabase/serverless";
   import ws from "ws";
   import { env } from "../env";

   // Node needs a WebSocket implementation (browsers ship their own).
   neonConfig.webSocketConstructor = ws;

   const createPrismaClient = () => {
     // Strip Prisma-only query params the pg-style parser rejects.
     const url = new URL(env.PRISMA_URL);
     url.searchParams.delete("pool_timeout");
     url.searchParams.delete("connect_timeout");

     const pool = new Pool({ connectionString: url.toString() });
     const adapter = new PrismaNeon(pool);

     return new Prisma.PrismaClient({
       adapter,
       log: env.NEXT_PUBLIC_NODE_ENV === "development"
         ? ["error", "warn"]
         : ["error"],
     });
   };
   ```
   (Singleton `globalForPrisma` pattern unchanged.)

4. **Regenerate** the client:
   ```bash
   pnpm --filter @adh/db sync   # = prisma generate
   ```

---

## Verification

Connection test against Neon, **WARP off**:

```
1st (cold): ~3.5s     # mostly Neon serverless compute cold-start
2nd (warm): ~1s
3rd (warm): ~1s
```
No connect/pool timeouts. For comparison, **with WARP on** the same connect was
**13–30s** and tripped Prisma's timeouts.

---

## Notes & caveats

- **Turn WARP off** for local dev — it only adds latency now. (`warp-cli disconnect`)
- **Restart the dev server** after pulling this change; the client is built at
  startup.
- **~3.5s cold connect** is Neon's scale-to-zero compute waking up; warm queries
  are ~1s (cross-region). The pool stays warm after the first hit.
- **The Prisma CLI** (`prisma db push` / `migrate` / `generate`) still connects
  via the query engine over **5432**, *not* the adapter. The
  `connect_timeout=30` and `pool_timeout=30` params left on `PRISMA_URL` in
  `.env` are there for those CLI operations on slow networks; the runtime client
  ignores them (they're stripped before the Neon pool sees the URL).
- **Production** was never affected by the local network issues, but it benefits
  from the same driver (lower connection overhead, no 5432 dependency).
- **Version pinning matters:** keep `@prisma/adapter-neon` in lockstep with the
  Prisma version. If you bump Prisma, bump the adapter to match.
