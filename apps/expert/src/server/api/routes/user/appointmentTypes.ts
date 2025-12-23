import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { AppointmentTypeName } from "@adh/db";

export const appointmentTypesRouter = createTRPCRouter({
  getAllAppointmentTypes: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.appointmentType.findMany({
      orderBy: { name: "asc" },
    });
  }),

  getAppointmentTypeById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.appointmentType.findUnique({
        where: { id: input.id },
      });
    }),

  createAppointmentType: publicProcedure
    .input(
      z.object({
        name: z.nativeEnum(AppointmentTypeName),
        description: z.string().optional(),
        duration: z.number(),
        maxAppointmentsPerClinician: z.number().optional(),
        gapToEarliestSlotMinutes: z.number().optional(),
      }),
    )

    .mutation(async ({ ctx, input }) => {
      return ctx.db.appointmentType.create({
        data: input,
      });
    }),

  updateAppointmentType: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.nativeEnum(AppointmentTypeName),
        description: z.string().optional(),
        duration: z.number(),
        maxAppointmentsPerClinician: z.number().optional(),
        gapToEarliestSlotMinutes: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.appointmentType.update({
        where: { id },
        data,
      });
    }),

  deleteAppointmentType: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.appointmentType.delete({
        where: { id: input.id },
      });
    }),
});
