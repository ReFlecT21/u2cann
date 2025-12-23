"use client";

import React from "react";
import { enUS, jaJP } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import { useCurrentLocale } from "next-i18n-router/client";
import { Toaster } from "sonner";

import { i18nConfig, Language } from "@adh/ui/i18nConfig";

import { ThemeProvider } from "~/components/ThemeProvider";
import { TRPCReactProvider } from "~/trpc/react";

// Declare a variable for cookie-based locale override
let cookieLocale: string | undefined;

if (typeof document !== "undefined") {
  cookieLocale = document.cookie
    .split("; ")
    .find((row) => row.startsWith("preferred-locale="))
    ?.split("=")[1];

  if (cookieLocale && !i18nConfig.locales.includes(cookieLocale as Language)) {
    // If the cookie locale is not in the supported locales, ignore it
    cookieLocale = undefined;
  }

  console.log("🍪 Overriding locale from cookie:", cookieLocale);
}

export default function MainProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  // Always get the locale from next-i18n-router first
  const routeLocale = useCurrentLocale(i18nConfig) as Language;

  // Decide which locale to use: the cookie override or the route-based locale
  const currentLocale = (cookieLocale as Language) || routeLocale;

  console.log("Current locale:lol", currentLocale);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Toaster richColors position="top-right" closeButton theme="system" />
      <ClerkProvider
        signUpUrl="/sign-up"
        localization={currentLocale === "ja" ? jaJP : enUS}
      >
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}
