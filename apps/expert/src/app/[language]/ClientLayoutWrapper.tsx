"use client";

import { useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Users2,
  Dumbbell,
  ClipboardList,
  CalendarDays,
  Camera,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { SidebarData } from "@adh/ui/custom/layout/app-sidebar";
import MainLayout from "~/components/MainLayout";
import { api } from "~/trpc/react";
import { Skeleton } from "@adh/ui/ui/skeleton";
import { useCurrentLocale } from "next-i18n-router/client";
import { i18nConfig } from "@adh/ui/i18nConfig";

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const { mutateAsync } = api.user.account.switchRole.useMutation();
  const { mutateAsync: createIndivAccount } =
    api.registration.client.createIndividualAccount.useMutation();
  const { mutateAsync: createCorpAccount } =
    api.registration.client.createCorporateAccount.useMutation();
  const { mutateAsync: createExpertAccount } =
    api.registration.expert.createExpertAccount.useMutation();
  const t = useTranslations("Layout");
  const locale = useCurrentLocale(i18nConfig);
  const { data: userRole } = api.user.account.getMyRole.useQuery();
  const isAdminUser = userRole === "admin";
  const isCoachUser = userRole === "coach";

  if (!user) {
    return (
      <div className="p-4">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-8 w-2/3 mb-2" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  const navData: SidebarData["navData"] = {
    [t("section.Management")]: [
      {
        isCollapsible: false,
        title: "Dashboard",
        url: `/${locale}/gym/dashboard`,
        icon: LayoutDashboard,
      },
      ...(isAdminUser
        ? [
            {
              isCollapsible: false,
              title: t("Management.Schedule"),
              url: `/${locale}/gym/schedule`,
              icon: Calendar,
            },
          ]
        : []),
      {
        isCollapsible: false,
        title: t("Management.Bookings"),
        url: `/${locale}/gym/bookings`,
        icon: ClipboardList,
      },
      ...(isAdminUser
        ? [
            {
              isCollapsible: false,
              title: "Members",
              url: `/${locale}/gym/users`,
              icon: Users2,
            },
          ]
        : []),
    ],
    ...(isAdminUser
      ? {
          [t("section.Settings")]: [
            {
              isCollapsible: false,
              title: t("Settings.ClassTypes"),
              url: `/${locale}/gym/classes`,
              icon: Dumbbell,
            },
            {
              isCollapsible: false,
              title: t("Settings.Instructors"),
              url: `/${locale}/gym/instructors`,
              icon: Users,
            },
            {
              isCollapsible: false,
              title: t("Settings.GymClosures"),
              url: `/${locale}/exclusions`,
              icon: CalendarDays,
            },
            {
              isCollapsible: false,
              title: "Face Devices",
              url: `/${locale}/gym/devices`,
              icon: Camera,
            },
          ],
        }
      : {}),
  };

  const handleSwitchRole = async (role: string, selectedType?: string) => {
    try {
      await mutateAsync({
        selectedRole: role,
        ...(selectedType
          ? { selectedType: selectedType as "individual" | "corporate" }
          : {}),
      });
    } catch (error) {
      console.error("Error switching role:", error);
    }
  };

  const handleCreateAccount = async (role: string) => {
    try {
      if (role === "individual") await createIndivAccount();
      else if (role === "corporate") await createCorpAccount();
      else if (role === "expert") await createExpertAccount();
      else throw new Error(`Invalid role: ${role}`);
    } catch (error) {
      console.error("Error creating account:", error);
    }
  };

  return (
    <MainLayout
      sidebarData={{
        navData,
        user: {
          name: user?.firstName ?? "",
          email: user?.emailAddresses[0]?.emailAddress ?? "",
          avatar: user?.imageUrl ?? "",
          role: user?.publicMetadata.selectedRole ?? "admin",
          availableRoles: (() => {
            const roles = user?.publicMetadata.roles ?? {};
            const result: string[] = [];

            if (roles.expert?.filledUp) result.push("expert");
            if (roles.admin) result.push("admin");
            if (roles.client?.individual?.filledUp) result.push("individual");
            if (roles.client?.corporate?.approved) result.push("corporate");

            return result;
          })(),
          onSwitchRole: handleSwitchRole,
          onCreateAccount: handleCreateAccount,
        },
      }}
      headerElement={<div>{t("adminTitle")}</div>}
    >
      {children}
    </MainLayout>
  );
}
