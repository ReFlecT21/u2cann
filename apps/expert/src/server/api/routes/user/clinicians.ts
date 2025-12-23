import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Define input schema for create and update
const clinicianSchema = z.object({
  email: z.string().email(),
  userName: z.string(),
  branchId: z.string(),
  specialty: z.string().optional(),
  appointmentTypes: z.array(z.string()).optional(),
  excludedSpecies: z.array(z.string()).optional(),
});

// Define update input schema
const updateClinicianSchema = clinicianSchema.extend({
  id: z.string(),
  userId: z.string(),
});

export const cliniciansRouter = createTRPCRouter({
  getAllClinicians: protectedProcedure.query(async ({ ctx }) => {
    // Get user's team ID
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { teamId: true },
    });

    if (!user?.teamId) {
      return [];
    }

    const clinicians = await ctx.db.clinician.findMany({
      where: {
        user: {
          teamId: user.teamId, // Filter clinicians by team
        },
      },
      include: {
        user: true,
        branch: true,
        appointmentTypes: true,
        species: true,
      },
    });

    return clinicians.map((c) => ({
      id: c.id,
      userId: c.userId,
      branchId: c.branchId,
      specialty: c.specialty,
      appointmentTypes: c.appointmentTypes,
      species: c.species,
      user: {
        name: c.user.name,
        email: c.user.email,
        branchName: c.branch.name,
      },
      branch: {
        name: c.branch.name,
      },
    }));
  }),

  createClinician: protectedProcedure
    .input(clinicianSchema)
    .mutation(async ({ ctx, input }) => {
      // Get current user's team ID
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true },
      });

      if (!currentUser?.teamId) {
        throw new Error("User does not belong to a team");
      }

      console.log("Creating clinician with input:", input);
      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          teamId: currentUser.teamId, // Use current user's team ID
          name: input.userName,
          role: "clinician", // Assuming role is set to clinician
        },
      });

      return ctx.db.clinician.create({
        data: {
          userId: user.id,
          branchId: input.branchId,
          specialty: input.specialty,
          appointmentTypes: {
            connect: input.appointmentTypes?.map((id) => ({ id })) ?? [],
          },
          species: {
            connect: input.excludedSpecies?.map((id) => ({ id })) ?? [],
          },
        },
      });
    }),

  updateClinician: protectedProcedure
    .input(updateClinicianSchema)
    .mutation(async ({ ctx, input }) => {
      // Get current user's team ID
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true },
      });

      if (!currentUser?.teamId) {
        throw new Error("User does not belong to a team");
      }

      // First verify the clinician belongs to the same team
      const existingClinician = await ctx.db.clinician.findFirst({
        where: {
          id: input.id,
          user: {
            teamId: currentUser.teamId,
          },
        },
      });

      if (!existingClinician) {
        throw new Error("Clinician not found or not in your team");
      }

      return ctx.db.clinician.update({
        where: { id: input.id },
        data: {
          userId: input.userId,
          branchId: input.branchId,
          specialty: input.specialty,
          appointmentTypes: {
            set: input.appointmentTypes?.map((id) => ({ id })) ?? [],
          },
          species: {
            set: input.excludedSpecies?.map((id) => ({ id })) ?? [],
          },
        },
      });
    }),

  deleteClinician: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get current user's team ID
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true },
      });

      if (!currentUser?.teamId) {
        throw new Error("User does not belong to a team");
      }

      // First verify the clinician belongs to the same team
      const existingClinician = await ctx.db.clinician.findFirst({
        where: {
          id: input.id,
          user: {
            teamId: currentUser.teamId,
          },
        },
      });

      if (!existingClinician) {
        throw new Error("Clinician not found or not in your team");
      }

      return ctx.db.clinician.delete({
        where: { id: input.id },
      });
    }),

  getClinicianIdByUserId: protectedProcedure.query(async ({ ctx }) => {
    const clinician = await ctx.db.clinician.findFirst({
      where: { userId: ctx.auth.userId },
      select: { id: true },
    });
    return clinician?.id ?? null;
  }),
});
