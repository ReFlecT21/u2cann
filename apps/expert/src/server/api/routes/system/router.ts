import { createTRPCRouter } from "../../trpc";
import { clerkRouter } from "./clerk";

export const systemRouter = createTRPCRouter({
  clerk: clerkRouter,
});
