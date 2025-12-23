/* eslint-disable react-hooks/rules-of-hooks */

"use client";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useCurrentLocale } from "next-i18n-router/client";

import { i18nConfig } from "@adh/ui/i18nConfig";

export function routerPush(
  router: AppRouterInstance,
  path: string,
  root = false,
) {
  const currentLocale = useCurrentLocale(i18nConfig);
  if (root || path.startsWith("/" + currentLocale)) {
    router.push(path);
  } else {
    router.push(`/${currentLocale}${path}`);
  }
}
