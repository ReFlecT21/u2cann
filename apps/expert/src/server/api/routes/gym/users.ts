import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { STRIPE_PRODUCT_TO_PLAN } from "~/config/stripe-products";

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

  // Create a new member manually (admin only)
  createMember: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        productId: z.string().nullable(), // Stripe product ID or null for custom
        customPlanName: z.string().nullable(),
        customSessions: z.number().int().positive().nullable(),
        sessionsIncluded: z.number().int().positive().nullable(),
        startDate: z.date(),
        expiryDate: z.date().nullable(),
        amountPaidCents: z.number().int().min(0),
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
          message: "Only admins can create members",
        });
      }

      // Check if user with this email already exists
      let user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      const fullName = `${input.firstName} ${input.lastName}`;

      if (!user) {
        // Create new user - generate a unique ID for non-Clerk users
        const uniqueId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        user = await ctx.db.user.create({
          data: {
            id: uniqueId,
            email: input.email,
            name: fullName,
            role: "trainee",
          },
        });
      }

      // Get or create the membership plan
      let plan;

      if (input.productId) {
        // Find existing plan from Stripe product
        const productConfig = STRIPE_PRODUCT_TO_PLAN[input.productId];
        if (!productConfig) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid product ID",
          });
        }

        plan = await ctx.db.membershipPlan.findUnique({
          where: { planType: productConfig.planType },
        });

        if (!plan) {
          // Create the plan if it doesn't exist
          plan = await ctx.db.membershipPlan.create({
            data: {
              planType: productConfig.planType,
              category: productConfig.category,
              name: productConfig.name,
              stripePriceId: `manual_${input.productId}`,
              stripeProductId: input.productId,
              sessionsIncluded: productConfig.sessionsIncluded,
              commitmentMonths: productConfig.commitmentMonths,
              priceInCents: productConfig.priceInCents,
            },
          });
        }
      } else {
        // Create a custom plan
        const customPlanType = `CUSTOM_${Date.now()}` as any;
        const isUnlimited = !input.customSessions;

        plan = await ctx.db.membershipPlan.create({
          data: {
            planType: "FREE_TRIAL", // Use FREE_TRIAL as a fallback type for custom plans
            category: isUnlimited ? "MONTHLY_SUBSCRIPTION" : "FLEXI_PACKAGE",
            name: input.customPlanName || "Custom Plan",
            stripePriceId: `custom_${Date.now()}`,
            stripeProductId: `custom_${Date.now()}`,
            sessionsIncluded: input.customSessions,
            commitmentMonths: null,
            priceInCents: input.amountPaidCents,
          },
        });
      }

      // Create the user membership
      const membership = await ctx.db.userMembership.create({
        data: {
          userId: user.id,
          planId: plan.id,
          status: "ACTIVE",
          sessionsRemaining: input.sessionsIncluded,
          sessionsUsed: 0,
          currentPeriodStart: input.startDate,
          currentPeriodEnd: input.expiryDate,
          activatedAt: input.startDate,
          expiresAt: input.expiryDate,
        },
        include: {
          plan: true,
          user: true,
        },
      });

      return membership;
    }),
});
