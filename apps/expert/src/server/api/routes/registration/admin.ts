import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const adminRegistration = createTRPCRouter({
  createTeam: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      console.log("userId", userId);

      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || "";

      // Ensure a single user row for this Clerk userId/email
      await ctx.db.$transaction(async (tx) => {
        const existingById = await tx.user.findUnique({
          where: { id: userId },
        });
        if (existingById) {
          // Keep email in sync
          if (existingById.email !== email) {
            await tx.user.update({ where: { id: userId }, data: { email } });
          }
          return;
        }

        const existingByEmail = await tx.user.findUnique({ where: { email } });
        if (existingByEmail && existingByEmail.id !== userId) {
          // Free unique email constraint on placeholder row, then migrate
          const tempEmail = `migrating+${Date.now()}@placeholder.local`;
          await tx.user.update({
            where: { id: existingByEmail.id },
            data: { email: tempEmail },
          });
          await tx.user.upsert({
            where: { id: userId },
            update: { email },
            create: { id: userId, email },
          });
          await tx.clinician.updateMany({
            where: { userId: existingByEmail.id },
            data: { userId },
          });
          await tx.user.delete({ where: { id: existingByEmail.id } });
          return;
        }

        // No conflicts, just upsert
        await tx.user.upsert({
          where: { id: userId },
          update: { email },
          create: { id: userId, email },
        });
      });

      // Create team
      const team = await ctx.db.team.create({
        data: {
          name: input.name,
          users: {
            connect: {
              id: userId,
            },
          },
        },
      });

      return team;
    }),
  createBranch: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        location: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        include: { team: true },
      });

      if (!user || !user.team) {
        throw new Error("User or team not found");
      }

      const branch = await ctx.db.branch.create({
        data: {
          name: input.name,
          location: input.location,
          teamId: user.team.id,
        },
      });

      return branch;
    }),
  getBranches: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      include: { team: { include: { branches: true } } },
    });

    if (!user?.team) throw new Error("Team not found");

    return user.team.branches;
  }),

  inviteClinician: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        specialty: z.string(),
        branchId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log("Inviting clinician:", input);
      const userId = ctx.auth.userId;
      const targetUser = await clerkClient.users.getUser(userId);

      await clerkClient.users.updateUser(targetUser.id, {
        publicMetadata: { signup: true, selectedRole: `admin` },
      });

      return true;
    }),

  getAppointments: protectedProcedure
    .input(
      z.object({
        isInAdminOrg: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const isAdmin = input?.isInAdminOrg ?? false;

      let whereCondition = {};

      if (!isAdmin) {
        const clinician = await ctx.db.clinician.findFirst({
          where: { userId: userId },
        });

        if (!clinician) {
          return [];
        }

        whereCondition = {
          clinicianId: clinician.id,
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
        time: appt.startTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        client: {
          name: appt.clinician.user.name ?? "Unknown",
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
          name: `Dr. ${appt.clinician.user.name ?? "Unknown"}`,
          clinic: appt.clinician.branch.name,
        },
        fee: 0, // placeholder
        paymentStatus: "Online Payments Disabled", // placeholder
      }));
    }),

  createSampleAppointments: protectedProcedure.mutation(async ({ ctx }) => {
    const clinician = await ctx.db.clinician.findFirst({
      include: { user: true, branch: true },
    });
    const species = await ctx.db.species.findFirst();
    const appointmentType = await ctx.db.appointmentType.findFirst();

    if (!clinician || !species || !appointmentType) {
      throw new Error("Missing required reference data");
    }

    const now = new Date();
    const sampleTimes = [9, 10, 11];

    const appointments = await Promise.all(
      sampleTimes.map((hour, index) =>
        ctx.db.appointment.create({
          data: {
            startTime: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              hour,
            ),
            endTime: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              hour + 1,
            ),
            clinicianId: clinician.id,
            appointmentTypeId: appointmentType.id,
            speciesId: species.id,
            petName: ["Pet", "Buddy", "Milo"][index] ?? "Pet",
            notes: "Sample data",
            status: "scheduled",
          },
        }),
      ),
    );

    return appointments;
  }),
});
