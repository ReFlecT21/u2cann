import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

import { createOrganizationSchema, USER_TYPES } from "~/types/clerk";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const clerkRouter = createTRPCRouter({
  changeUserSelectedRole: protectedProcedure
  .input(
    z.object({
      type: z.enum(USER_TYPES),
      originalMetadata: z.record(z.string(), z.any()),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    try {
      await clerkClient.users.updateUserMetadata(ctx.auth.userId, {
        publicMetadata: {
          ...input.originalMetadata,
          roles: {
            ...input.originalMetadata.roles,
            client: {
              ...input.originalMetadata.roles?.client, // Preserve existing client roles
              selectedType: input.type, // ✅ Change only the selectedType inside roles.client
            },
          },
        },
      });
      return true;
    } catch {
      return false;
    }
  }),
  changeUserSelectedMainRole: protectedProcedure
  .input(
    z.object({
      role: z.enum(["client", "expert"]), // ✅ Allow only "client" or "expert"
      originalMetadata: z.record(z.string(), z.any()),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    try {
      await clerkClient.users.updateUserMetadata(ctx.auth.userId, {
        publicMetadata: {
          ...input.originalMetadata, // ✅ Keep all existing metadata
          selectedRole: input.role, // ✅ Change only the selectedRole
        },
      });
      return true;
    } catch {
      return false;
    }
  }),


  createOrganization: protectedProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, slug } = input;

      const organization = await clerkClient.organizations.createOrganization({
        name,
        slug,
        createdBy: ctx.auth.userId,
      });

      return organization;
    }),
});
