import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { encrypt, decrypt } from "~/server/lib/encryption";
import { testConnection } from "~/server/lib/hikvisionBridge";

async function requireAdmin(
  db: typeof import("@adh/db").db,
  userId: string,
): Promise<void> {
  const me = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (me?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
}

const deviceInputBase = z.object({
  name: z.string().min(1).max(100),
  ipAddress: z.string().min(1).max(64),
  port: z.number().int().min(1).max(65535).default(80),
  username: z.string().min(1).max(64),
  isActive: z.boolean().default(true),
  notes: z.string().max(500).optional(),
});

export const hikvisionDevicesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    await requireAdmin(ctx.db, ctx.auth.userId!);
    const devices = await ctx.db.hikvisionDevice.findMany({
      orderBy: { createdAt: "asc" },
    });
    // Never return encrypted password; expose a flag instead
    return devices.map((d) => ({
      id: d.id,
      name: d.name,
      ipAddress: d.ipAddress,
      port: d.port,
      username: d.username,
      hasPassword: !!d.encryptedPassword,
      isActive: d.isActive,
      lastSyncedAt: d.lastSyncedAt,
      notes: d.notes,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  }),

  create: protectedProcedure
    .input(
      deviceInputBase.extend({
        password: z.string().min(1).max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.db, ctx.auth.userId!);
      const encryptedPassword = encrypt(input.password);
      return ctx.db.hikvisionDevice.create({
        data: {
          name: input.name,
          ipAddress: input.ipAddress,
          port: input.port,
          username: input.username,
          encryptedPassword,
          isActive: input.isActive,
          notes: input.notes ?? null,
        },
      });
    }),

  update: protectedProcedure
    .input(
      deviceInputBase.partial().extend({
        id: z.string(),
        password: z.string().min(1).max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.db, ctx.auth.userId!);
      const { id, password, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (password) {
        data.encryptedPassword = encrypt(password);
      }
      return ctx.db.hikvisionDevice.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.db, ctx.auth.userId!);
      await ctx.db.hikvisionDevice.delete({ where: { id: input.id } });
      return { success: true };
    }),

  testConnection: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.db, ctx.auth.userId!);
      const device = await ctx.db.hikvisionDevice.findUnique({
        where: { id: input.id },
      });
      if (!device) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Device not found" });
      }
      const password = decrypt(device.encryptedPassword);
      const result = await testConnection({
        ip: device.ipAddress,
        port: device.port,
        username: device.username,
        password,
      });
      return result;
    }),
});
