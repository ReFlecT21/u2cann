"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import { type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@adh/ui/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@adh/ui/ui/sidebar";

export type NavItem =
  | {
      isCollapsible: true;
      title: string;
      icon?: LucideIcon;
      isActive?: boolean;
      items: {
        title: string;
        url: string;
      }[];
    }
  | {
      isCollapsible: false;
      title: string;
      url: string;
      icon?: LucideIcon;
    };
interface NavMainProps {
  items: NavItem[];
  label: string;
}

export function NavMain({ items, label }: NavMainProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label.toUpperCase()}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, index) => {
          if (item.isCollapsible) {
            return (
              <Collapsible
                key={index}
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          } else {
            return (
              <SidebarMenuItem key={index}>
                <SidebarMenuButton tooltip={item.title} asChild>
                  <a href={item.url} className="flex items-center gap-2">
                    {item.icon && <item.icon className="size-4" />}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
