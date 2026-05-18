"use client";

import ClientOnly from "@/components/client-only";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";

export default function RecentConversationsSkeleton() {
  return (
    <SidebarMenu className="gap-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <SidebarMenuItem key={i}>
          <ClientOnly>
            <SidebarMenuSkeleton showIcon />
          </ClientOnly>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
