import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { sendWelcomeEmail } from "~/server/services/emailService";

export const usersRouter = createTRPCRouter({
  // Get all membership plans for dropdown
  getMembershipPlans: protectedProcedure.query(async ({ ctx }) => {
    const plans = await ctx.db.membershipPlan.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return plans;
  }),

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
            paymentMethod: activeMembership.paymentMethod,
            paymentMethodDetails: activeMembership.paymentMethodDetails,
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
        planId: z.string(), // Membership plan ID from database
        sessionsIncluded: z.number().int().positive().nullable(),
        startDate: z.date(),
        expiryDate: z.date().nullable(),
        amountPaidCents: z.number().int().min(0),
        paymentMethod: z.string().optional(), // e.g., "card", "paynow", "cash", "bank_transfer"
        paymentMethodDetails: z.string().optional(), // e.g., "Visa •••• 4242", "PayNow", "Cash"
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.auth.userId;

      // Check if user is admin
      const currentUser = await ctx.db.user.findUnique({
        where: { id: adminId },
        select: { role: true },
      });

      if (currentUser?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create members",
        });
      }

      const fullName = `${input.firstName} ${input.lastName}`;
      const client = await clerkClient();

      // Step 1: Find or create Clerk user
      let clerkUser;
      const existingUsers = await client.users.getUserList({
        emailAddress: [input.email],
      });

      if (existingUsers.totalCount > 0) {
        clerkUser = existingUsers.data[0];
        console.log("[createMember] Found existing Clerk user:", clerkUser.id);
      } else {
        // Create new Clerk user
        clerkUser = await client.users.createUser({
          emailAddress: [input.email],
          firstName: input.firstName,
          lastName: input.lastName,
          skipPasswordRequirement: true, // Will use OTP
        });
        console.log("[createMember] Created Clerk user:", clerkUser.id);
      }

      // Step 2: Ensure user exists in database
      let dbUser = await ctx.db.user.findUnique({
        where: { id: clerkUser.id },
      });

      if (!dbUser) {
        // Check if user exists by email (might be from different clerk account)
        const existingByEmail = await ctx.db.user.findUnique({
          where: { email: input.email },
        });

        if (existingByEmail) {
          // Migrate user to new clerk ID
          await ctx.db.user.delete({ where: { id: existingByEmail.id } });
        }

        dbUser = await ctx.db.user.create({
          data: {
            id: clerkUser.id,
            email: input.email,
            name: fullName,
            role: "trainee",
          },
        });
        console.log("[createMember] Created DB user:", dbUser.id);
      } else {
        console.log("[createMember] Found existing DB user:", dbUser.id);
      }

      // Step 3: Get the membership plan from database
      const plan = await ctx.db.membershipPlan.findUnique({
        where: { id: input.planId },
      });

      if (!plan) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid membership plan",
        });
      }

      console.log("[createMember] Using plan:", plan.planType);

      // Step 4: Create the user membership
      const membership = await ctx.db.userMembership.create({
        data: {
          userId: dbUser.id,
          planId: plan.id,
          status: "ACTIVE",
          sessionsRemaining: input.sessionsIncluded,
          sessionsUsed: 0,
          currentPeriodStart: input.startDate,
          currentPeriodEnd: input.expiryDate,
          activatedAt: input.startDate,
          expiresAt: input.expiryDate,
          paymentMethod: input.paymentMethod,
          paymentMethodDetails: input.paymentMethodDetails,
        },
        include: {
          plan: true,
          user: true,
        },
      });

      console.log("[createMember] Created membership:", membership.id);

      // Step 5: Send welcome email
      await sendWelcomeEmail({
        to: input.email,
        firstName: input.firstName,
      });

      console.log("[createMember] Welcome email sent to:", input.email);

      return membership;
    }),
});
