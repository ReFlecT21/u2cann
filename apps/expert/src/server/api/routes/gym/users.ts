import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const usersRouter = createTRPCRouter({
  // Get all users with membership and booking info (admin only)
  getAll: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(["admin", "coach", "trainee"]).optional(),
        membershipStatus: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "PAUSED", "PENDING_PAYMENT"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Check if user is admin
      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (currentUser?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view all users",
        });
      }

      const whereClause: any = {};

      if (input?.search) {
        whereClause.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
        ];
      }

      if (input?.role) {
        whereClause.role = input.role;
      }

      const users = await ctx.db.user.findMany({
        where: whereClause,
        include: {
          memberships: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              plan: true,
            },
          },
          classBookings: {
            where: { status: "confirmed" },
            select: { id: true },
          },
          _count: {
            select: {
              classBookings: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Transform data for easier consumption
      return users.map((user) => {
        const activeMembership = user.memberships[0];

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
          // Membership info
          membership: activeMembership ? {
            id: activeMembership.id,
            planName: activeMembership.plan.name,
            planType: activeMembership.plan.planType,
            category: activeMembership.plan.category,
            status: activeMembership.status,
            sessionsRemaining: activeMembership.sessionsRemaining,
            sessionsUsed: activeMembership.sessionsUsed,
            currentPeriodEnd: activeMembership.currentPeriodEnd,
            expiresAt: activeMembership.expiresAt,
            activatedAt: activeMembership.activatedAt,
          } : null,
          // Booking stats
          totalBookings: user._count.classBookings,
          confirmedBookings: user.classBookings.length,
        };
      });
    }),

  // Get single user details
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Check if user is admin
      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (currentUser?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view user details",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        include: {
          memberships: {
            orderBy: { createdAt: "desc" },
            include: {
              plan: true,
            },
          },
          classBookings: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
              session: {
                include: {
                  classType: true,
                  instructor: true,
                },
              },
            },
          },
          _count: {
            select: {
              classBookings: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return user;
    }),

  // Update user role (admin only)
  updateRole: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        role: z.enum(["admin", "coach", "trainee"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Check if user is admin
      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (currentUser?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update user roles",
        });
      }

      // Prevent admin from changing their own role
      if (input.id === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own role",
        });
      }

      return ctx.db.user.update({
        where: { id: input.id },
        data: { role: input.role },
      });
    }),

  // Get user stats summary
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;

    // Check if user is admin
    const currentUser = await ctx.db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (currentUser?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view user stats",
      });
    }

    const [
      totalUsers,
      adminCount,
      coachCount,
      traineeCount,
      activeMemberships,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.count({ where: { role: "admin" } }),
      ctx.db.user.count({ where: { role: "coach" } }),
      ctx.db.user.count({ where: { role: "trainee" } }),
      ctx.db.userMembership.count({ where: { status: "ACTIVE" } }),
    ]);

    return {
      totalUsers,
      adminCount,
      coachCount,
      traineeCount,
      activeMemberships,
    };
  }),
});
