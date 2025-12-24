import { createTRPCRouter } from "~/server/api/trpc";
import { publicScheduleRouter } from "./publicSchedule";
import { classTypesRouter } from "./classTypes";
import { instructorsRouter } from "./instructors";
import { sessionsRouter } from "./sessions";
import { templatesRouter } from "./templates";
import { bookingsRouter } from "./bookings";

export const gymRouter = createTRPCRouter({
  // Public endpoints (no auth required)
  public: publicScheduleRouter,

  // Admin endpoints (auth required)
  classTypes: classTypesRouter,
  instructors: instructorsRouter,
  sessions: sessionsRouter,
  templates: templatesRouter,
  bookings: bookingsRouter,
});
