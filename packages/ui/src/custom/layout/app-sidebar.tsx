"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@adh/ui/ui/sidebar";

import { NavItem, NavMain } from "./nav-main";
import { NavUser, SidebarUser } from "./nav-user";
import { SidebarCollapse } from "./sidebar-collapse";

export interface SidebarData {
  user: SidebarUser;
  navData: Record<string, NavItem[]>;
}

export function AppSidebar({
  data,
  SignOutButton,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  data: SidebarData;
  SignOutButton: React.ComponentType<any>;
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b">
        <SidebarCollapse />
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(data.navData).map(([key, navMain], index) => (
          <NavMain items={navMain} label={key} key={index} />
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <NavUser user={data.user} SignOutButton={SignOutButton} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
