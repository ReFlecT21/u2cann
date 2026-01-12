import { createTRPCRouter } from "~/server/api/trpc";
import { accountRouter } from "./account";

export const userRouter = createTRPCRouter({
  account: accountRouter,
});
