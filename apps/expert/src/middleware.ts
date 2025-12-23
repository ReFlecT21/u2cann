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
    env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    "/:locale?/sign-up",
  ]),
  createAccount: createRouteMatcher([
    "/:locale?/create-account",
    "/:locale?/create-account/(.*)",
  ]),
  settings: createRouteMatcher([
    "/:locale?/appointment-types(.*)",
    "/:locale?/branches(.*)",
    "/:locale?/clinicians(.*)",
    "/:locale?/exclusions(.*)",
    "/:locale?/species(.*)",
  ]),
};

// Determine route type
function getRouteType(req: NextRequest) {
  if (routes.api(req)) return "api";
  if (routes.public(req)) return "public";
  if (routes.createAccount(req)) return "createAccount";
  if (routes.settings(req)) return "settings";

  return "public"; // Default to public
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
      // Ensure DB user gets merged to Clerk ID on first authenticated request
      try {
        console.log("[middleware] calling /api/internal/merge-user");
        const mergeResp = await fetch(
          new URL(`/api/internal/merge-user`, origin),
          {
            method: "POST",
            headers: { cookie: req.headers.get("cookie") ?? "" },
            cache: "no-store",
          },
        );
        console.log("[middleware] merge-user status", mergeResp.status);
      } catch {
        // ignore merge failures; the merge can occur later
        console.log("[middleware] merge-user failed");
      }

      // Server-side onboarding gate. If user already exists in our DB (by id/email), skip create-account.
      try {
        console.log("[middleware] calling /api/internal/onboarding");
        const resp = await fetch(new URL(`/api/internal/onboarding`, origin), {
          headers: { cookie: req.headers.get("cookie") ?? "" },
          cache: "no-store",
        });
        const data = (await resp.json()) as { needsSetup: boolean };
        console.log("[middleware] onboarding result", data);
        const isCreateAccountPath =
          req.nextUrl.pathname.includes("create-account");
        if (data.needsSetup && !isCreateAccountPath) {
          const target = new URL(`/create-account`, origin);
          console.log(
            "[middleware] redirect -> create-account",
            target.toString(),
          );
          return NextResponse.redirect(target);
        }
      } catch {
        // ignore onboarding check failures
        console.log("[middleware] onboarding check failed");
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

  // Guard settings pages: admin-only using DB-backed endpoint
  // Temporarily disabled - allow anyone to access settings pages
  // if (routeType === "settings") {
  //   try {
  //     const resp = await fetch(new URL(`/api/internal/is-admin`, origin), {
  //       headers: { cookie: req.headers.get("cookie") ?? "" },
  //       cache: "no-store",
  //     });
  //     const { isAdmin } = (await resp.json()) as { isAdmin: boolean };
  //     if (!isAdmin) {
  //       const locale =
  //         req.nextUrl.pathname.split("/")[1] || i18nConfig.defaultLocale;
  //       return NextResponse.redirect(new URL(`/${locale}/overview`, origin));
  //     }
  //   } catch {
  //     const locale =
  //       req.nextUrl.pathname.split("/")[1] || i18nConfig.defaultLocale;
  //     return NextResponse.redirect(new URL(`/${locale}/overview`, origin));
  //   }
  // }
});

export const config = {
  matcher: [
    // Exclude exact root path `/`, static files, and public assets
    "/((?!^/$|_next|favicon.ico|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
  cache: "no-cache",
};
