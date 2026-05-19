"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { getConversationsQuery } from "@/remotes/conversations/query";

export default function TopNav() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const conversationMatch = pathname.match(/^\/chat\/([^/]+)$/);
  const conversationId = conversationMatch?.[1];

  const { data: conversations, isPending } = useQuery({
    ...getConversationsQuery(),
    enabled: !!conversationId,
  });

  const subtitle = (() => {
    if (conversationId) {
      return isPending
        ? null
        : (conversations?.find((c) => c.id === conversationId)?.title ??
            "세금 상담");
    }

    if (pathname === "/coverage") {
      return "상담 범위";
    }

    return undefined;
  })();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-4">
      {isMobile && (
        <>
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border" />
        </>
      )}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {subtitle !== undefined ? (
              <span className="text-sm text-muted-foreground">tax·ai</span>
            ) : (
              <BreadcrumbPage>tax·ai</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {subtitle !== undefined && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {subtitle === null ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <BreadcrumbPage>{subtitle}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
