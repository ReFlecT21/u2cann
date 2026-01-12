"use client";

import Image from "next/image";
import { PanelLeft, PanelRight } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@adh/ui/ui/sidebar";

export function SidebarCollapse() {
  const { toggleSidebar, open } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className={`hover:bg-transparent active:bg-transparent ${!open ? "justify-center" : ""}`}
          onClick={toggleSidebar}
          tooltip={open ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {open ? (
            <>
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="U2Can"
                  width={36}
                  height={36}
                  className="rounded-full shadow-md"
                  priority
                />
                <div className="flex flex-col">
                  <span className="font-bold text-base text-gray-900 dark:text-white">U2Can</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Boxing Gym</span>
                </div>
              </div>
              <PanelLeft className="ml-auto size-4 text-gray-400" />
            </>
          ) : (
            <Image
              src="/logo.png"
              alt="U2Can"
              width={32}
              height={32}
              className="rounded-full shadow-md"
              priority
            />
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
