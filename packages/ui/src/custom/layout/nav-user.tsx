"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CaretSortIcon } from "@radix-ui/react-icons";
import {
  BriefcaseBusiness,
  LogOut,
  Moon,
  PlusCircle,
  Settings,
  Shield,
  Sun,
  User,
  UserCog,
} from "lucide-react";
import { useCurrentLocale } from "next-i18n-router/client";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { i18nConfig } from "@adh/ui/i18nConfig";
import { Avatar, AvatarFallback, AvatarImage } from "@adh/ui/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@adh/ui/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@adh/ui/ui/sidebar";
import { Skeleton } from "@adh/ui/ui/skeleton";

export interface SidebarUser {
  name: string;
  email: string;
  avatar: string;
  role: string;
  availableRoles: string[];
  onCreateAccount: (role: string) => Promise<void>;
  onSwitchRole: (
    role: string,
    selectedType?: "individual" | "corporate",
  ) => Promise<void>;
  userAccountType?: {
    availableTypes: {
      individual?: string;
      corporate?: {
        id: string;
        name: string;
        imageUrl: string;
      }[];
    };
    selectedType: string;
    onChange: (type: string) => Promise<void> | void;
  };
}

const AvailableRolesIconMapping = {
  expert: <UserCog />,
  admin: <Shield />,
  individual: <User />,
  corporate: <BriefcaseBusiness />,
};

interface NavUserProps {
  user: SidebarUser;
  SignOutButton: React.ComponentType<any>;
}

export function NavUser({ user, SignOutButton }: NavUserProps) {
  const { isMobile } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const t = useTranslations("navUser");
  const { user: clerkUser } = useUser();

  const isDevelopment =
    process.env.NEXT_PUBLIC_CDK_ENVIRONMENT === "development";
  const adminOrgId = isDevelopment
    ? "org_2ulWV48dmjQOZkpdk0QZGBNgLhz" // Replace with actual development org ID
    : "org_2vLYgQzP4WPaowX3vbezK6YcCdO"; // Production org ID

  const isAdminOrg =
    clerkUser?.organizationMemberships?.some(
      (membership) =>
        membership.organization.id === adminOrgId &&
        membership.role === "org:admin",
    ) || false;

  console.log(
    "organization",
    clerkUser?.organizationMemberships[0]?.organization.id,
  );
  console.log("hi", user.availableRoles);

  const userObject = useUser() as {
    user?: {
      publicMetadata?: {
        roles?: {
          client?: {
            selectedType?: string;
            corporate?: {
              approved?: boolean;
            };
          };
        };
      };
    };
  };
  const currentLocale = useCurrentLocale(i18nConfig);

  function routerPush(path: string) {
    if (path.startsWith("/" + currentLocale)) {
      router.push(path);
    } else {
      router.push(`/${currentLocale}${path}`);
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {user ? (
                <>
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <CaretSortIcon className="ml-auto size-4" />
                </>
              ) : (
                <Skeleton className="h-8 w-8 rounded-lg" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {user ? (
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            ) : (
              <Skeleton className="h-8 w-8 rounded-lg" />
            )}
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
              >
                {resolvedTheme === "dark" ? <Sun /> : <Moon />}
                {resolvedTheme === "dark" ? t("light") : t("dark")} {t("mode")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  routerPush(`/account/settings`);
                }}
              >
                <Settings />
                {t("accountSettings")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {((user.role === "client" &&
              userObject.user?.publicMetadata?.roles?.client &&
              userObject.user?.publicMetadata.roles?.client.selectedType ===
                "corporate") ||
              isAdminOrg) && (
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => {
                    routerPush(
                      `/${user.role}/organization-profile/[[...organization-profile]]`,
                    );
                  }}
                >
                  <Settings />
                  {t("orgSettings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
            )}

            <DropdownMenuGroup>
              <SignOutButton>
                <DropdownMenuItem>
                  <LogOut />
                  {t("logout")}
                </DropdownMenuItem>
              </SignOutButton>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
