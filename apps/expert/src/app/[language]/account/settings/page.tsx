"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { Skeleton } from "@adh/ui/ui/skeleton";

import { api } from "~/trpc/react";
import PaymentSettingsPage from "./payment";

export default function AdminAccountSettingsPage() {
  const { resolvedTheme } = useTheme();

  const searchParams = useSearchParams();

  return (
    <div>
      <UserProfile
        routing="virtual"
        appearance={{
          baseTheme: resolvedTheme === "dark" ? dark : undefined,
          elements: {
            rootBox: {
              width: "100%",
            },
            cardBox: {
              width: "100%",
            },
          },
        }}
      ></UserProfile>
    </div>
  );
}
