import { z } from "zod";

export const ROLES = ["superadmin", "admin", "expert", "client"] as const;

export type Role = (typeof ROLES)[number];

export const USER_TYPES = ["individual", "corporate"] as const;

export type UserType = (typeof USER_TYPES)[number];

export type UserRoles = {
  superadmin?: {};
  admin?: {};
  expert?: {
    filledUp?: boolean;
  };
  client?: {
    individual?: {
      filledUp?: boolean;
    };
    corporate?: {
      filledUp?: boolean;
      approved?: boolean;
    };
    selectedType: UserType;
  };
};

export const createOrganizationSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
});

export type CreateOrganizationSchema = z.infer<typeof createOrganizationSchema>;
