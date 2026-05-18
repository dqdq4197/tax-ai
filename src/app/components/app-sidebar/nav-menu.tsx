"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield, History } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/utils/cn";

const navItems = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/coverage", icon: Shield, label: "상담 범위" },
  { href: "/changelog", icon: History, label: "업데이트 내역" },
] as const;

export default function NavMenu() {
  const pathname = usePathname();

  const activeItem = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  return (
    <SidebarMenu className="gap-0.5">
      {navItems.map((item) => {
        const isActive = item === activeItem;

        return (
          <SidebarMenuItem key={item.href}>
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-3.5 rounded-xs bg-sidebar-primary z-10 pointer-events-none transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0" />
            )}
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.label}
              size="m"
              className={cn(
                isActive
                  ? "text-sidebar-foreground"
                  : "text-muted-foreground hover:text-sidebar-foreground",
              )}
            >
              <Link href={item.href}>
                <item.icon
                  size={15}
                  className={cn({
                    "text-sidebar-primary": isActive,
                  })}
                />
                <span className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
                  {item.label}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
