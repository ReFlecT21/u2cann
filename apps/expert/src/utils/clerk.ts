import { auth, clerkClient, ClerkMiddlewareAuth } from "@clerk/nextjs/server";

import { Role } from "~/types/clerk";

type CheckRoleOutput = {
  status: boolean;
  rolesAvailable: Role[];
  nextBestRole: Role | null;
};

export const checkRole = async (
  role: Role,
  middlewareAuth?: ClerkMiddlewareAuth,
): Promise<CheckRoleOutput> => {
  const { sessionClaims, userId } = middlewareAuth ? middlewareAuth() : auth();
  if (!userId) {
    return {
      status: false,
      rolesAvailable: [] as Role[],
      nextBestRole: null,
    };
  }

  let userRoles = sessionClaims?.metadata.roles;
  if (!userRoles) {
    await clerkClient().users.updateUserMetadata(userId, {
      publicMetadata: {
        roles: {},
        selectedRole: undefined,
      },
    });

    userRoles = {};
  }

  const status = userRoles[role] !== undefined;
  const roles = Object.keys(userRoles) as Role[];

  let nextBestRole: Role | null = null;

  if (!status) {
    if (roles[0] !== undefined) {
      nextBestRole = roles[0];
    }
  } else {
    if (sessionClaims.metadata.selectedRole !== role) {
      console.log("Updating user metadata");
      await clerkClient().users.updateUserMetadata(userId, {
        publicMetadata: {
          roles: sessionClaims.metadata.roles,
          selectedRole: role,
        },
      });
    }
  }

  return {
    status,
    rolesAvailable: Object.keys(userRoles) as Role[],
    nextBestRole,
  };
};

export const getClientId = (
  userId: string,
  metadata: UserPublicMetadata,
  orgId?: string,
) => {
  const clientType = metadata.roles?.client?.selectedType;
  if (clientType === "corporate" && orgId) {
    return orgId;
  }
  return userId;
};
