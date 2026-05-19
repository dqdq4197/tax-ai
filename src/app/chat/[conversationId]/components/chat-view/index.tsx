"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { takePendingChat } from "@/utils/pending-prompt";
import { getMessagesQuery } from "@/remotes/conversations/query";
import ChatComposer from "@/components/chat-composer";
import ChatLayout from "./chat-layout";
import ChatInterface from "./chat-interface";
import InterruptedChat from "./interrupted-chat";
import { toUIMessage } from "../../utils/ui-message";

function ChatSkeleton() {
  return (
    <div className="mx-auto max-w-190 space-y-8 px-4 py-8">
      <div className="flex justify-end">
        <Skeleton className="h-14 w-2/3 rounded-[18px_18px_6px_18px]" />
      </div>
      <div className="flex gap-3.5">
        <Skeleton className="size-8 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-1/2 rounded-[18px_18px_6px_18px]" />
      </div>
    </div>
  );
}

function DisabledComposer({ placeholder }: { placeholder: string }) {
  return (
    <ChatComposer
      value=""
      disabled
      placeholder={placeholder}
      onChange={() => {}}
      onSubmit={() => {}}
    />
  );
}

function ChatRestorer({ conversationId }: { conversationId: string }) {
  const { data, isPending, isError } = useQuery(
    getMessagesQuery({ conversationId }),
  );

  if (isPending) {
    return (
      <ChatLayout
        footer={<DisabledComposer placeholder="대화를 불러오는 중…" />}
      >
        <ChatSkeleton />
      </ChatLayout>
    );
  }

  if (isError) {
    return (
      <ChatLayout
        footer={<DisabledComposer placeholder="대화를 불러올 수 없어요" />}
      >
        <div className="flex h-full items-center justify-center">
          <p className="typo-body2 text-muted-foreground">
            대화를 불러올 수 없어요.
          </p>
        </div>
      </ChatLayout>
    );
  }

  const dbMessages = data;
  const lastMessage = dbMessages[dbMessages.length - 1];

  // Case 1: 아직 assistant 응답 없음 — 생성 재개.
  if (lastMessage?.role === "user") {
    return (
      <ChatInterface
        key={conversationId}
        conversationId={conversationId}
        initialMessages={dbMessages.slice(0, -1).map(toUIMessage)}
        initialPrompt={lastMessage.content}
      />
    );
  }

  // Case 2: 스트리밍 도중 생성 중단됨.
  if (
    lastMessage?.role === "assistant" &&
    lastMessage.status === "generating"
  ) {
    return (
      <InterruptedChat conversationId={conversationId} messages={dbMessages} />
    );
  }

  // Case 3: 정상 완료된 대화.
  return (
    <ChatInterface
      key={conversationId}
      conversationId={conversationId}
      initialMessages={dbMessages.map(toUIMessage)}
    />
  );
}

interface ChatViewProps {
  conversationId: string;
}

export default function ChatView({ conversationId }: ChatViewProps) {
  const [initialPrompt] = useState(() => takePendingChat(conversationId));

  if (initialPrompt) {
    return (
      <ChatInterface
        key={conversationId}
        conversationId={conversationId}
        initialPrompt={initialPrompt}
      />
    );
  }

  return <ChatRestorer conversationId={conversationId} />;
}
