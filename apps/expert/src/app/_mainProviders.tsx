"use client";

import React from "react";
import { enUS, jaJP } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
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

function ClerkProviderWithTheme({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Language;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      localization={locale === "ja" ? jaJP : enUS}
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        variables: {
          colorPrimary: resolvedTheme === "dark" ? "#3b82f6" : "#1f2937",
        },
        elements: {
          formButtonPrimary:
            "bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900",
          card: "bg-background",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          formFieldInput: "bg-background text-foreground border-input",
          formFieldLabel: "text-foreground",
          identityPreviewText: "text-foreground",
          footerActionLink: "text-primary hover:text-primary/80",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
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

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Toaster richColors position="top-right" closeButton theme="system" />
      <ClerkProviderWithTheme locale={currentLocale}>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </ClerkProviderWithTheme>
    </ThemeProvider>
  );
}
