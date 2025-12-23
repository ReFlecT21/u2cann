import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { clerkClient } from "@clerk/nextjs/server";

export const accountRouter = createTRPCRouter({
  isUserInAdminOrg: protectedProcedure.query(async ({ ctx }) => {
    // Try by auth user id first (works if DB id == Clerk id)
    let user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { role: true, email: true },
    });

    // If not found, fall back to lookup by email from Clerk
    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(ctx.auth.userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (email) {
          user = await ctx.db.user.findFirst({
            where: { email },
            select: { role: true, email: true },
          });
        }
      } catch {
        // ignore clerk errors; will return false below
      }
    }

    return user?.role === "admin";
  }),
  getUserTeamId: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { teamId: true },
    });

    return user?.teamId;
  }),
});
