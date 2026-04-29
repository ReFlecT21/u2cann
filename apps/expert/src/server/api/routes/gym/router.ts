import { createTRPCRouter } from "~/server/api/trpc";
import { publicScheduleRouter } from "./publicSchedule";
import { classTypesRouter } from "./classTypes";
import { instructorsRouter } from "./instructors";
import { sessionsRouter } from "./sessions";
import { templatesRouter } from "./templates";
import { bookingsRouter } from "./bookings";
import { usersRouter } from "./users";
import { dashboardRouter } from "./dashboard";
import { closuresRouter } from "./closures";
import { faceEnrollmentRouter } from "./faceEnrollment";
import { hikvisionDevicesRouter } from "./hikvisionDevices";

export const gymRouter = createTRPCRouter({
  // Public endpoints (no auth required)
  public: publicScheduleRouter,

  // Admin endpoints (auth required)
  classTypes: classTypesRouter,
  instructors: instructorsRouter,
  sessions: sessionsRouter,
  templates: templatesRouter,
  bookings: bookingsRouter,
  users: usersRouter,
  dashboard: dashboardRouter,
  closures: closuresRouter,
  faceEnrollment: faceEnrollmentRouter,
  hikvisionDevices: hikvisionDevicesRouter,
});
