import { Role, UserRoles } from "./clerk";

declare global {
  interface UserPublicMetadata {
    roles?: UserRoles;
    selectedRole?: Role;
  }
  interface CustomJwtSessionClaims {
    metadata: UserPublicMetadata;
  }
}
