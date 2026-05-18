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

type Conversation = {
  id: string;
  title: string;
  meta: string;
};

// TODO: replace with real data from API
const MOCK_CONVERSATIONS: Conversation[] = [
  { id: "c1", title: "단순경비율 적용 가능한가요, 안가능한가요", meta: "방금" },
  { id: "c2", title: "프리랜서 경비 인정 항목", meta: "오늘" },
  { id: "c3", title: "홈택스 신고 순서 안내", meta: "어제" },
  { id: "c4", title: "매출 5천만원 세금 계산", meta: "2주 전" },
  { id: "c5", title: "단순경비율 적용 가능한가요, 안가능한가요", meta: "방금" },
  { id: "c6", title: "프리랜서 경비 인정 항목", meta: "오늘" },
  { id: "c7", title: "홈택스 신고 순서 안내", meta: "어제" },
  { id: "c8", title: "매출 5천만원 세금 계산", meta: "2주 전" },
  {
    id: "c11",
    title: "단순경비율 적용 가능한가요, 안가능한가요",
    meta: "방금",
  },
  { id: "c22", title: "프리랜서 경비 인정 항목", meta: "오늘" },
  { id: "c33", title: "홈택스 신고 순서 안내", meta: "어제" },
  { id: "c44", title: "매출 5천만원 세금 계산", meta: "2주 전" },
  {
    id: "c111",
    title: "단순경비율 적용 가능한가요, 안가능한가요",
    meta: "방금",
  },
  { id: "c222", title: "프리랜서 경비 인정 항목", meta: "오늘" },
  { id: "c333", title: "홈택스 신고 순서 안내", meta: "어제" },
  { id: "c446", title: "매출 5천만원 세금 계산", meta: "2주 전" },
  { id: "c445", title: "매출 5천만원 세금 계산", meta: "2주 전" },
  { id: "c441", title: "매출 5천만원 세금 계산", meta: "2주 전" },
  { id: "c442", title: "매출 5천만원 세금 계산", meta: "2주 전" },
  { id: "c443", title: "매출 5천만원 세금 계산", meta: "2주 전" },
];

export default function RecentConversations() {
  const pathname = usePathname();
  const activeConversationId = pathname.match(/^\/chat\/([^/]+)/)?.[1] ?? null;

  return (
    <ScrollArea className="h-full">
      <SidebarMenu className="gap-1">
        {MOCK_CONVERSATIONS.map((chat) => {
          const isActive = activeConversationId === chat.id;
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
                  <span className="flex-1 truncate min-w-0">{chat.title}</span>
                  <span className="typo-caption5 text-muted-foreground/50 shrink-0">
                    {chat.meta}
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
