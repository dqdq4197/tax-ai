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
import NavMenu from "./nav-menu";
import RecentConversations from "./recent-conversations";
import NewConversationButton from "./new-conversation-button";

export default function AppSidebar() {
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader
        className={cn(
          "flex-row items-center p-4 pb-3.5 justify-between",
          "group-data-[collapsible=icon]:px-2",
        )}
      >
        {/* Logo — hidden in icon mode */}
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <div
            className="size-5.5 rounded-[7px] grid place-items-center text-white font-bold text-[12px] tracking-[-0.02em] shrink-0"
            style={{
              background:
                "linear-gradient(135deg, var(--sidebar-primary), oklch(0.6 0.18 265))",
              boxShadow:
                "0 4px 12px color-mix(in oklch, var(--sidebar-primary) 40%, transparent)",
            }}
          >
            τ
          </div>
          <span className="typo-body1 font-bold text-sidebar-foreground">
            tax<span className="text-sidebar-primary">·ai</span>
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger
              size="icon"
              className="text-muted-foreground hover:text-sidebar-foreground transition-color"
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
        <SidebarGroup className="flex-auto overflow-hidden transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none">
          <SidebarGroupLabel>최근 상담</SidebarGroupLabel>
          <RecentConversations />
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
