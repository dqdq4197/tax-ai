"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { conversationsQuery } from "@/remotes/conversations/query";
import { formatRelativeDate } from "@/utils/format-relative-date";
import RecentConversationsSkeleton from "./recent-conversations-skeleton";
import RecentConversationsError from "./recent-conversations-error";

export default function RecentConversations() {
  const pathname = usePathname();
  const activeConversationId = pathname.match(/^\/chat\/([^/]+)/)?.[1] ?? null;

  const {
    data: conversations,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    ...conversationsQuery(),
    placeholderData: keepPreviousData,
  });

  if (isPending) return <RecentConversationsSkeleton />;
  if (isError)
    return <RecentConversationsError error={error} refetch={() => refetch()} />;
  if (conversations.length === 0)
    return (
      <p className="typo-caption4 px-2 py-2 text-muted-foreground/50">
        아직 상담 내역이 없어요
      </p>
    );

  return (
    <ScrollArea className="h-full">
      <SidebarMenu className="gap-1">
        {conversations.map((chat) => {
          const isActive = activeConversationId === chat.id;
          const label = chat.title ?? chat.firstMessage ?? "새 대화";
          return (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton asChild isActive={isActive}>
                <Link href={`/chat/${chat.id}`}>
                  <MessageCircle
                    size={14}
                    className={cn(
                      "shrink-0",
                      isActive
                        ? "text-sidebar-primary"
                        : "text-muted-foreground/60",
                    )}
                  />
                  <span className="flex-1 truncate min-w-0">{label}</span>
                  <span className="typo-caption5 text-muted-foreground/50 shrink-0">
                    {formatRelativeDate(chat.createdAt)}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </ScrollArea>
  );
}
