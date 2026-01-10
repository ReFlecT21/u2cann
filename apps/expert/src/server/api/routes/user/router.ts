import { createTRPCRouter } from "~/server/api/trpc";
import { accountRouter } from "./account";
import { branchesRouter } from "./branches";

export const userRouter = createTRPCRouter({
  account: accountRouter,
  branches: branchesRouter,
});
