import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const speciesRouter = createTRPCRouter({
  getSpecies: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.species.findMany({
      where: { display: true },
      orderBy: { name: "asc" },
    });
  }),

  getAllSpecies: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.species.findMany({
      orderBy: { name: "asc" },
    });
  }),

  getHiddenSpecies: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.species.findMany({
      where: { display: false },
      orderBy: { name: "asc" },
    });
  }),

  createSpecies: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Species name is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.species.upsert({
        where: { name: input.name },
        update: { display: true },
        create: {
          name: input.name,
          display: true,
        },
      });
    }),

  hideSpecies: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.species.update({
        where: { id: input.id },
        data: { display: false },
      });
    }),
});
