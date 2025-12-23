import * as Prisma from "@prisma/client";

import { env } from "../env";

const createPrismaClient = () =>
  new Prisma.PrismaClient({
    log:
      env.NEXT_PUBLIC_NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NEXT_PUBLIC_NODE_ENV !== "production") globalForPrisma.prisma = db;

export { Prisma };

// Export enums for use in the application
export { AppointmentTypeName, AppointmentStatus, Role, ExclusionType, ClinicExclusionType } from "@prisma/client";
