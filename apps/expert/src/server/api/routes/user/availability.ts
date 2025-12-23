import dayjs from "dayjs";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const availabilityRouter = createTRPCRouter({
  getAllAvailabilityGroups: protectedProcedure.query(async ({ ctx }) => {
    // Get current user's team ID
    const currentUser = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { teamId: true },
    });

    if (!currentUser?.teamId) {
      return [];
    }

    const groups = await ctx.db.availabilityGroup.findMany({
      where: {
        clinician: {
          user: {
            teamId: currentUser.teamId, // Filter by team
          },
        },
      },
      include: {
        availability: true,
      },
    });

    return groups.map((group) => ({
      ...group,
      availability: group.availability.map((a) => ({
        day: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][a.dayOfWeek],
        start: a.startTime, // already in "9:00am" format
        end: a.endTime,
      })),
    }));
  }),

  getAvailabilityGroupById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get current user's team ID
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true },
      });

      if (!currentUser?.teamId) {
        return null;
      }

      return ctx.db.availabilityGroup.findFirst({
        where: {
          id: input.id,
          clinician: {
            user: {
              teamId: currentUser.teamId,
            },
          },
        },
        include: {
          availability: true,
        },
      });
    }),

  createAvailabilityGroup: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        clinicianId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const defaultAvailability = [
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
      ];

      const group = await ctx.db.availabilityGroup.create({
        data: {
          name: input.name,
          timezone: "Asia/Singapore",
          clinician: { connect: { id: input.clinicianId } },
          availability: {
            create: defaultAvailability,
          },
        },
        include: { availability: true },
      });
      return group;
    }),

  updateAvailabilityGroup: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        availability: z
          .array(
            z.object({
              id: z.string().optional(),
              dayOfWeek: z.number().min(0).max(6),
              startTime: z.string(),
              endTime: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, availability } = input;

      // Get current user's team ID and verify access
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true },
      });

      if (!currentUser?.teamId) {
        throw new Error("User does not belong to a team");
      }

      // Verify the availability group belongs to the user's team
      const existingGroup = await ctx.db.availabilityGroup.findFirst({
        where: {
          id,
          clinician: {
            user: {
              teamId: currentUser.teamId,
            },
          },
        },
      });

      if (!existingGroup) {
        throw new Error("Availability group not found or not in your team");
      }

      console.log("deded", input);

      if (availability) {
        // Delete existing time blocks and recreate to simplify update
        await ctx.db.availability.deleteMany({
          where: { availabilityGroupId: id },
        });
      }

      const parsedAvailability = availability?.map((block) => ({
        dayOfWeek: block.dayOfWeek,
        startTime: block.startTime,
        endTime: block.endTime,
      }));

      const updatedGroup = await ctx.db.availabilityGroup.update({
        where: { id },
        data: {
          name,
          availability: parsedAvailability
            ? {
                create: parsedAvailability,
              }
            : undefined,
        },
        include: { availability: true },
      });

      return updatedGroup;
    }),

  deleteAvailabilityGroup: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get current user's team ID and verify access
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true },
      });

      if (!currentUser?.teamId) {
        throw new Error("User does not belong to a team");
      }

      // Verify the availability group belongs to the user's team
      const existingGroup = await ctx.db.availabilityGroup.findFirst({
        where: {
          id: input.id,
          clinician: {
            user: {
              teamId: currentUser.teamId,
            },
          },
        },
      });

      if (!existingGroup) {
        throw new Error("Availability group not found or not in your team");
      }

      // Delete associated time blocks first due to foreign key constraints
      await ctx.db.availability.deleteMany({
        where: { availabilityGroupId: input.id },
      });

      const deletedGroup = await ctx.db.availabilityGroup.delete({
        where: { id: input.id },
      });

      return deletedGroup;
    }),
  getAvailabilityById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get current user's team ID
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true },
      });

      if (!currentUser?.teamId) {
        return null;
      }

      return ctx.db.availabilityGroup.findFirst({
        where: {
          id: input.id,
          clinician: {
            user: {
              teamId: currentUser.teamId,
            },
          },
        },
        include: {
          availability: true,
        },
      });
    }),

  // Slot Exclusions
  getSlotExclusions: protectedProcedure
    .input(z.object({ clinicianId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user has access to this clinician
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true },
      });

      const clinician = await ctx.db.clinician.findFirst({
        where: {
          id: input.clinicianId,
          user: { teamId: currentUser?.teamId },
        },
      });

      if (!clinician) {
        throw new Error("Clinician not found or access denied");
      }

      return await ctx.db.slotExclusion.findMany({
        where: { clinicianId: input.clinicianId },
        orderBy: { date: "asc" },
      });
    }),

  createSlotExclusion: protectedProcedure
    .input(
      z.object({
        clinicianId: z.string(),
        date: z.string(), // ISO date string
        startTime: z.string(),
        endTime: z.string(),
        reason: z.string().optional(),
        type: z.enum([
          "sick",
          "vacation",
          "training",
          "conference",
          "personal",
          "maintenance",
          "emergency",
          "other",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to this clinician
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true },
      });

      const clinician = await ctx.db.clinician.findFirst({
        where: {
          id: input.clinicianId,
          user: { teamId: currentUser?.teamId },
        },
      });

      if (!clinician) {
        throw new Error("Clinician not found or access denied");
      }

      return await ctx.db.slotExclusion.create({
        data: {
          clinicianId: input.clinicianId,
          date: new Date(input.date),
          startTime: input.startTime,
          endTime: input.endTime,
          reason: input.reason,
          type: input.type,
        },
      });
    }),

  updateSlotExclusion: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        date: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        reason: z.string().optional(),
        type: z
          .enum([
            "sick",
            "vacation",
            "training",
            "conference",
            "personal",
            "maintenance",
            "emergency",
            "other",
          ])
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Verify user has access to this exclusion
      const exclusion = await ctx.db.slotExclusion.findUnique({
        where: { id },
        include: {
          clinician: {
            include: { user: true },
          },
        },
      });

      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true },
      });

      if (
        !exclusion ||
        exclusion.clinician.user.teamId !== currentUser?.teamId
      ) {
        throw new Error("Exclusion not found or access denied");
      }

      return await ctx.db.slotExclusion.update({
        where: { id },
        data: {
          ...updateData,
          date: updateData.date ? new Date(updateData.date) : undefined,
        },
      });
    }),

  deleteSlotExclusion: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to this exclusion
      const exclusion = await ctx.db.slotExclusion.findUnique({
        where: { id: input.id },
        include: {
          clinician: {
            include: { user: true },
          },
        },
      });

      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true },
      });

      if (
        !exclusion ||
        exclusion.clinician.user.teamId !== currentUser?.teamId
      ) {
        throw new Error("Exclusion not found or access denied");
      }

      return await ctx.db.slotExclusion.delete({
        where: { id: input.id },
      });
    }),

  // Clinic-wide Exclusions (Admin only)
  getClinicExclusions: protectedProcedure.query(async ({ ctx }) => {
    // Get current user's team ID
    const currentUser = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { teamId: true, role: true },
    });

    if (!currentUser?.teamId) {
      throw new Error("User not associated with any team");
    }

    // Check if user is admin
    if (currentUser.role !== "admin") {
      throw new Error("Only admins can view clinic exclusions");
    }

    return await ctx.db.clinicExclusion.findMany({
      where: { teamId: currentUser.teamId },
      orderBy: { date: "asc" },
    });
  }),

  createClinicExclusion: protectedProcedure
    .input(
      z.object({
        date: z.string(), // ISO date string
        startTime: z.string().optional(), // null for all-day
        endTime: z.string().optional(), // null for all-day
        reason: z.string().optional(),
        type: z.enum([
          "holiday",
          "maintenance",
          "emergency",
          "training",
          "event",
          "closure",
          "other",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get current user's team ID and verify admin role
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true, role: true },
      });

      if (!currentUser?.teamId) {
        throw new Error("User not associated with any team");
      }

      if (currentUser.role !== "admin") {
        throw new Error("Only admins can create clinic exclusions");
      }

      return await ctx.db.clinicExclusion.create({
        data: {
          teamId: currentUser.teamId,
          date: new Date(input.date),
          startTime: input.startTime,
          endTime: input.endTime,
          reason: input.reason,
          type: input.type,
        },
      });
    }),

  updateClinicExclusion: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        date: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        reason: z.string().optional(),
        type: z
          .enum([
            "holiday",
            "maintenance",
            "emergency",
            "training",
            "event",
            "closure",
            "other",
          ])
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Verify user has access to this exclusion and is admin
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true, role: true },
      });

      if (currentUser?.role !== "admin") {
        throw new Error("Only admins can update clinic exclusions");
      }

      const exclusion = await ctx.db.clinicExclusion.findUnique({
        where: { id },
      });

      if (!exclusion || exclusion.teamId !== currentUser?.teamId) {
        throw new Error("Exclusion not found or access denied");
      }

      return await ctx.db.clinicExclusion.update({
        where: { id },
        data: {
          ...updateData,
          date: updateData.date ? new Date(updateData.date) : undefined,
        },
      });
    }),

  deleteClinicExclusion: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to this exclusion and is admin
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true, role: true },
      });

      if (currentUser?.role !== "admin") {
        throw new Error("Only admins can delete clinic exclusions");
      }

      const exclusion = await ctx.db.clinicExclusion.findUnique({
        where: { id: input.id },
      });

      if (!exclusion || exclusion.teamId !== currentUser?.teamId) {
        throw new Error("Exclusion not found or access denied");
      }

      return await ctx.db.clinicExclusion.delete({
        where: { id: input.id },
      });
    }),
});
