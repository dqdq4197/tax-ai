"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import { BrandIcon } from "@/components/ui/brand-icon";
import NavMenu from "./nav-menu";
import RecentConversations from "./recent-conversations";
import NewConversationButton from "./new-conversation-button";

export default function AppSidebar() {
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader
        className={cn(
          "flex-row items-center justify-between p-4 pb-3.5",
          "group-data-[collapsible=icon]:px-2",
        )}
      >
        {/* Logo — hidden in icon mode */}
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <BrandIcon size="sm" />
          <span className="typo-body1 font-bold text-sidebar-foreground">
            tax<span className="text-sidebar-primary">·ai</span>
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger
              size="icon"
              className="transition-color text-muted-foreground hover:text-sidebar-foreground"
            />
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-1.5">
            <span>
              {state === "collapsed" ? "사이드바 열기" : "사이드바 닫기"}
            </span>
          </TooltipContent>
        </Tooltip>
      </SidebarHeader>

      <SidebarContent>
        <NewConversationButton />
        <SidebarGroup>
          <NavMenu />
        </SidebarGroup>
        <SidebarGroup className="flex-auto overflow-hidden transition-opacity duration-200 group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
          <SidebarGroupLabel>최근 상담</SidebarGroupLabel>
          <RecentConversations />
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
