import { createTRPCRouter } from "../../trpc";

import { adminRegistration } from "./admin";
export const registrationRouter = createTRPCRouter({
  admin: adminRegistration,
});
