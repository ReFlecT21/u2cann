import { createTRPCRouter } from "~/server/api/trpc";
import { accountRouter } from "./account";
import { appointmentsRouter } from "./appointments";
import { speciesRouter } from "./species";
import { appointmentTypesRouter } from "./appointmentTypes";
import { branchesRouter } from "./branches";
import { cliniciansRouter } from "./clinicians";
import { availabilityRouter } from "./availability";
export const userRouter = createTRPCRouter({
  appointments: appointmentsRouter,
  account: accountRouter,
  species: speciesRouter,
  appointmentTypes: appointmentTypesRouter,
  branches: branchesRouter,
  clinicians: cliniciansRouter,
  availability: availabilityRouter,
});
