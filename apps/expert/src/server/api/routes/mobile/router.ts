import { createTRPCRouter } from "~/server/api/trpc";
import { customerAppointmentRouter } from "./customerAppointments";
import { customerClinicRouter } from "./clinics";
import { customerContentRouter } from "./content";
import { customerMessageRouter } from "./messages";
import { customerPetRouter } from "./pets";
import { customerUserRouter } from "./users";

export const mobileRouter = createTRPCRouter({
  appointments: customerAppointmentRouter,
  clinics: customerClinicRouter,
  content: customerContentRouter,
  messages: customerMessageRouter,
  pets: customerPetRouter,
  users: customerUserRouter,
});