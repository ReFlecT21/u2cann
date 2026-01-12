import { NextRequest, NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { env } from "./env";

// Route matchers
const publicRoutes = createRouteMatcher([
  "/",
  "/sign-in",
  "/sign-in/(.*)",
  "/schedule",
  "/schedule/(.*)",
  "/api/webhooks/stripe",
  "/api/webhooks/clerk",
  "/api/trpc/(.*)",
  "/health",
]);

const adminRoutes = createRouteMatcher(["/admin", "/admin/(.*)"]);
const coachRoutes = createRouteMatcher(["/coach", "/coach/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();
  const path = req.nextUrl.pathname;
  const origin = req.nextUrl.origin;

  // Allow public routes
  if (publicRoutes(req)) {
    // If user is logged in and on root, redirect to role-based dashboard
    if (userId && path === "/") {
      return NextResponse.redirect(new URL("/redirect", origin));
    }
    return NextResponse.next();
  }

  // Require auth for all other routes
  if (!userId) {
    return NextResponse.redirect(new URL("/", origin));
  }

  // Allow /redirect route (handles role-based redirection)
  if (path === "/redirect") {
    return NextResponse.next();
  }

  // All authenticated requests proceed
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
