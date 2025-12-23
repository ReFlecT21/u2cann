import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const appointmentsRouter = createTRPCRouter({
  getAppointments: protectedProcedure
    .input(
      z.object({
        isInAdminOrg: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const isAdmin = input?.isInAdminOrg ?? false;

      // Get current user's team ID
      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });

      if (!currentUser?.teamId) {
        return [];
      }

      let whereCondition = {};

      if (!isAdmin) {
        // For non-admin users, show only their own appointments
        const clinician = await ctx.db.clinician.findFirst({
          where: { userId: userId },
        });

        if (!clinician) {
          return [];
        }

        whereCondition = {
          clinicianId: clinician.id,
        };
      } else {
        // For admin users, show all appointments within their team
        whereCondition = {
          clinician: {
            user: {
              teamId: currentUser.teamId,
            },
          },
        };
      }

      const appointments = await ctx.db.appointment.findMany({
        where: whereCondition,
        include: {
          clinician: {
            include: {
              user: true,
              branch: true,
            },
          },
          appointmentType: true,
          species: true,
        },
        orderBy: { startTime: "asc" },
      });

      return appointments.map((appt) => ({
        id: appt.id,
        time: appt.startTime.toISOString(),
        client: {
          name:
            appt.clinician.user.name ||
            appt.clinician.user.email.split("@")[0] ||
            "Unknown Client",
          email: appt.clinician.user.email,
          phone: "N/A", // no phone in schema, optionally extend user model
        },
        patient: {
          name: appt.petName,
          type: appt.species.name,
        },
        appointmentType: appt.appointmentType.name,
        status: appt.status.charAt(0).toUpperCase() + appt.status.slice(1),
        clinician: {
          name: appt.clinician.user.name
            ? `Dr. ${appt.clinician.user.name}`
            : `Dr. ${appt.clinician.user.email.split("@")[0]}`,
          clinic: appt.clinician.branch.name,
        },
        fee: 0, // placeholder
        paymentStatus: "Online Payments Disabled", // placeholder
      }));
    }),

  updateAppointmentStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["scheduled", "cancelled", "completed"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Get current user's team ID
      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });

      if (!currentUser?.teamId) {
        throw new Error("User does not belong to a team");
      }

      // Verify the appointment belongs to the same team
      const existingAppointment = await ctx.db.appointment.findFirst({
        where: {
          id: input.id,
          clinician: {
            user: {
              teamId: currentUser.teamId,
            },
          },
        },
      });

      if (!existingAppointment) {
        throw new Error("Appointment not found or not in your team");
      }

      return ctx.db.appointment.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  deleteAppointment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Get current user's team ID
      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });

      if (!currentUser?.teamId) {
        throw new Error("User does not belong to a team");
      }

      // Verify the appointment belongs to the same team
      const existingAppointment = await ctx.db.appointment.findFirst({
        where: {
          id: input.id,
          clinician: {
            user: {
              teamId: currentUser.teamId,
            },
          },
        },
      });

      if (!existingAppointment) {
        throw new Error("Appointment not found or not in your team");
      }

      return ctx.db.appointment.delete({
        where: { id: input.id },
      });
    }),

  createAppointment: protectedProcedure
    .input(
      z.object({
        startTime: z.date(),
        endTime: z.date(),
        clinicianId: z.string(),
        appointmentTypeId: z.string(),
        speciesId: z.string(),
        petName: z.string().min(1, "Pet name is required"),
        clientName: z.string().min(1, "Client name is required"),
        clientEmail: z.string().email("Valid email is required"),
        clientPhone: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Get current user's team ID
      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });

      if (!currentUser?.teamId) {
        throw new Error("User does not belong to a team");
      }

      // Verify the clinician belongs to the user's team
      const clinician = await ctx.db.clinician.findUnique({
        where: { id: input.clinicianId },
        include: {
          user: true,
          slotExclusions: true,
        },
      });

      if (!clinician) {
        throw new Error("Clinician not found");
      }

      if (clinician.user.teamId !== currentUser.teamId) {
        throw new Error(
          "Not authorized to create appointment for this clinician",
        );
      }

      // Check for clinic-wide exclusions
      const appointmentDate = new Date(input.startTime.toDateString());
      const clinicExclusions = await ctx.db.clinicExclusion.findMany({
        where: {
          teamId: currentUser.teamId,
          date: appointmentDate,
        },
      });

      for (const exclusion of clinicExclusions) {
        if (!exclusion.startTime || !exclusion.endTime) {
          // All-day exclusion
          throw new Error(
            `Clinic is closed on ${appointmentDate.toDateString()}: ${exclusion.reason || exclusion.type}`,
          );
        }

        const exclusionStart = new Date(
          `${appointmentDate.toDateString()} ${exclusion.startTime}`,
        );
        const exclusionEnd = new Date(
          `${appointmentDate.toDateString()} ${exclusion.endTime}`,
        );

        if (
          (input.startTime >= exclusionStart &&
            input.startTime < exclusionEnd) ||
          (input.endTime > exclusionStart && input.endTime <= exclusionEnd) ||
          (input.startTime <= exclusionStart && input.endTime >= exclusionEnd)
        ) {
          throw new Error(
            `Clinic is closed during this time: ${exclusion.reason || exclusion.type}`,
          );
        }
      }

      // Check for clinician slot exclusions
      for (const exclusion of clinician.slotExclusions) {
        const exclusionDate = new Date(exclusion.date.toDateString());
        if (exclusionDate.getTime() === appointmentDate.getTime()) {
          const exclusionStart = new Date(
            `${appointmentDate.toDateString()} ${exclusion.startTime}`,
          );
          const exclusionEnd = new Date(
            `${appointmentDate.toDateString()} ${exclusion.endTime}`,
          );

          if (
            (input.startTime >= exclusionStart &&
              input.startTime < exclusionEnd) ||
            (input.endTime > exclusionStart && input.endTime <= exclusionEnd) ||
            (input.startTime <= exclusionStart && input.endTime >= exclusionEnd)
          ) {
            throw new Error(
              `Clinician is not available during this time: ${exclusion.reason || exclusion.type}`,
            );
          }
        }
      }

      // Check for conflicting appointments
      const conflictingAppointments = await ctx.db.appointment.findMany({
        where: {
          clinicianId: input.clinicianId,
          OR: [
            {
              AND: [
                { startTime: { lte: input.startTime } },
                { endTime: { gt: input.startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: input.endTime } },
                { endTime: { gte: input.endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: input.startTime } },
                { endTime: { lte: input.endTime } },
              ],
            },
          ],
        },
      });

      if (conflictingAppointments.length > 0) {
        throw new Error(
          "Clinician already has an appointment during this time",
        );
      }

      // Create the appointment
      return ctx.db.appointment.create({
        data: {
          startTime: input.startTime,
          endTime: input.endTime,
          clinicianId: input.clinicianId,
          appointmentTypeId: input.appointmentTypeId,
          speciesId: input.speciesId,
          petName: input.petName,
          notes: input.notes,
          status: "scheduled",
        },
        include: {
          clinician: {
            include: {
              user: true,
              branch: true,
            },
          },
          appointmentType: true,
          species: true,
        },
      });
    }),
});
