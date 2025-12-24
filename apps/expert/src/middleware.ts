import { NextRequest, NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { i18nConfig } from "@adh/ui/i18nConfig";

import { env } from "./env";

import { getBaseUrl } from "./utils/getBaseUrl"; // eslint-disable-line @typescript-eslint/no-unused-vars
// Group routes by access type
const routes = {
  api: createRouteMatcher(["/api/(.*)", "/trpc/(.*)"]),
  public: createRouteMatcher([
    "/:locale?/",
    "/:locale?/health",
    "/:locale?/schedule",
    "/:locale?/schedule/(.*)",
    env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    "/:locale?/sign-up",
  ]),
  settings: createRouteMatcher([
    "/:locale?/gym/classes(.*)",
    "/:locale?/gym/instructors(.*)",
    "/:locale?/branches(.*)",
    "/:locale?/exclusions(.*)",
  ]),
};

// Determine route type
function getRouteType(req: NextRequest) {
  if (routes.api(req)) return "api";
  if (routes.public(req)) return "public";
  if (routes.settings(req)) return "settings";

  return "protected"; // Default to protected (requires auth)
}

export default clerkMiddleware(async (auth, req) => {
  const routeType = getRouteType(req);
  const origin = req.nextUrl.origin;
  const path = req.nextUrl.pathname;
  try {
    console.log("[middleware] start", { routeType, origin, path });
  } catch {
    // logging failed (edge console unavailable)
  }

  // Handle API routes
  if (routeType === "api") {
    return NextResponse.next();
  }

  // Handle public routes
  if (routeType === "public") {
    const acceptLanguage = req.headers.get("accept-language");
    const browserLang = acceptLanguage?.split(",")[0]?.split("-")[0]; // e.g., "ja"
    const matchedLang = i18nConfig.locales.includes(browserLang as any)
      ? (browserLang as "en" | "cn" | "ja" | "my" | "kr")
      : i18nConfig.defaultLocale;

    const res = NextResponse.next();
    res.cookies.set("preferred-locale", matchedLang || "en", { path: "/" });

    if (auth().userId) {
      try {
        console.log("[middleware] authenticated request", {
          userId: auth().userId,
          path,
        });
      } catch {
        // ignore
      }
      // Redirect logged-in users from `/` to `/{locale}/overview`
      if (req.nextUrl.pathname === "/") {
        const target = new URL(`/${matchedLang}/overview`, origin);
        console.log("[middleware] redirect -> overview", target.toString());
        return NextResponse.redirect(target);
      }
    }

    return res;
  }

  // Auth required beyond this point
  const authObject = auth();
  if (!authObject.userId) {
    return NextResponse.redirect(
      new URL(env.NEXT_PUBLIC_CLERK_SIGN_IN_URL, origin),
    );
  }

  // All authenticated requests can proceed
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Exclude exact root path `/`, static files, and public assets
    "/((?!^/$|_next|favicon.ico|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
  cache: "no-cache",
};
