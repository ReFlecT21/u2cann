import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { registrationRouter } from "./routes/registration/router";
import { systemRouter } from "./routes/system/router";
import { userRouter } from "./routes/user/router";
import { mobileRouter } from "./routes/mobile/router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */

export const appRouter = createTRPCRouter({
  // Users
  user: userRouter,

  // System
  system: systemRouter,

  // Registration
  registration: registrationRouter,

  // Mobile App APIs
  mobile: mobileRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
