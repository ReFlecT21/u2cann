"use client";

import Image from "next/image";
import { ArrowLeft, PanelLeft } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@adh/ui/ui/sidebar";

export function SidebarCollapse() {
  const { toggleSidebar } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-[#F2E8DF] hover:bg-[#FDF7F2]"
          onClick={toggleSidebar}
          tooltip="Toggle Sidebar"
          variant={"outline"}
          style={{ backgroundColor: "rgb(252, 244, 237)" }}
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
            <PanelLeft className="hidden size-4 md:block" />
            <ArrowLeft className="block size-5 md:hidden" />
          </div>
          <div className="grid flex-1 text-sm leading-tight text-left">
            <Image
              src="/logo.png"
              alt="logo"
              width={80}
              height={32}
              style={{
                height: "auto",
                width: "auto",
              }}
              className="hidden dark:block"
              priority
            />
            <Image
              src="/logo_dark.png"
              alt="logo"
              width={80}
              height={32}
              style={{
                height: "auto",
                width: "auto",
              }}
              className="block dark:hidden"
              priority
            />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
