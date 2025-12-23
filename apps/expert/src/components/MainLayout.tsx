"use client";

import { ReactNode } from "react";
import { SignOutButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";

import { AppSidebar, SidebarData } from "@adh/ui/custom/layout/app-sidebar";
import { LanguageSwitcher } from "@adh/ui/custom/layout/language-switcher";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@adh/ui/ui/sidebar";
import { Toaster } from "@adh/ui/ui/sonner";

export default function MainLayout({
  sidebarData,
  headerElement,
  children,
}: {
  sidebarData: SidebarData;
  headerElement: ReactNode;
  children: ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  return (
    <SidebarProvider>
      <Toaster
        richColors
        position="top-right"
        closeButton
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
      <AppSidebar data={sidebarData} SignOutButton={SignOutButton} />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border bg-sidebar px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="flex md:hidden" />
            {headerElement}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </header>
        <div className="max-h-[calc(100%-4rem)] max-w-full overflow-x-scroll overflow-y-scroll p-4 group-has-[[data-collapsible=icon]]/sidebar-wrapper:max-h-[calc(100%-3rem)]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
