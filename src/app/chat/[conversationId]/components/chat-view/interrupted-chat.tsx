"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/ui/brand-icon";
import ChatComposer from "@/components/chat-composer";
import type { Message } from "@/remotes/schemas";
import UserBubble from "./user-bubble";
import AssistantBubble from "./assistant-bubble";
import ChatLayout from "./chat-layout";
import ChatInterface from "./chat-interface";
import { getTextContent, toUIMessage } from "../../utils/ui-message";

interface InterruptedChatProps {
  conversationId: string;
  messages: Message[];
}

export default function InterruptedChat({
  conversationId,
  messages,
}: InterruptedChatProps) {
  const [retrying, setRetrying] = useState(false);

  // 재시도 기준이 될 마지막 user message 탐색
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  // 중단된 assistant message를 제외한 표시용 메시지 목록
  const visibleMessages = messages
    .filter((m) => !(m.role === "assistant" && m.status === "generating"))
    .map(toUIMessage);

  if (retrying && lastUserMsg) {
    return (
      <ChatInterface
        key={`${conversationId}-retry`}
        conversationId={conversationId}
        initialMessages={visibleMessages.filter((m) => m.id !== lastUserMsg.id)}
        initialPrompt={lastUserMsg.content}
      />
    );
  }

  return (
    <ChatLayout
      footer={
        <ChatComposer
          value=""
          disabled
          placeholder="다시 시도하면 대화를 이어갈 수 있어요"
          onChange={() => {}}
          onSubmit={() => {}}
        />
      }
    >
      <div className="mx-auto max-w-190 space-y-6 px-4 py-6">
        {visibleMessages.map((msg) => (
          <div key={msg.id} className="group/msg">
            {msg.role === "user" ? (
              <UserBubble content={getTextContent(msg)} />
            ) : (
              <AssistantBubble content={getTextContent(msg)} />
            )}
          </div>
        ))}

        <div className="flex gap-3.5">
          <BrandIcon className="mt-0.5" />
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <p className="typo-body2 text-muted-foreground">
              응답 생성이 중단되었어요.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => setRetrying(true)}
            >
              <RefreshCw className="size-3.5" />
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}
