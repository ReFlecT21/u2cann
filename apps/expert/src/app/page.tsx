"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { i18nConfig } from "@adh/ui/i18nConfig";

import { usePathname } from "next/navigation";

export default function SignInForm() {
  const { resolvedTheme } = useTheme();
  const userObject = useUser();
  const pathname = usePathname();

  let currentLocale =
    i18nConfig.locales.find((lang) => pathname.startsWith(`/${lang}`)) ||
    i18nConfig.defaultLocale;

  // 👇 Override it with cookie, if available
  if (typeof document !== "undefined") {
    const cookieLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("preferred-locale="))
      ?.split("=")[1];

    if (cookieLocale && i18nConfig.locales.includes(cookieLocale as any)) {
      currentLocale = cookieLocale;
    }
  }

  if (userObject.isLoaded && !userObject.isSignedIn) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center">
        <SignIn
          routing="hash"
          appearance={{
            baseTheme: resolvedTheme === "dark" ? dark : undefined,
          }}
          forceRedirectUrl={`${currentLocale}/overview`}
          signUpForceRedirectUrl={`/sign-up`}
          signUpUrl="/sign-up"
        />
      </div>
    );
  }

  return null;
}
