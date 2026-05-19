"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ChatComposer from "@/components/chat-composer";
import UserBubble from "./user-bubble";
import AssistantBubble from "./assistant-bubble";
import ChatLayout from "./chat-layout";
import { getTextContent } from "../../utils/ui-message";
import { useUpdateConversationTitle } from "../../hooks/useUpdateConversationTitle";

export interface ChatInterfaceProps {
  conversationId: string;
  initialMessages?: UIMessage[];
  initialPrompt?: string;
}

export default function ChatInterface({
  conversationId,
  initialMessages,
  initialPrompt,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const initialPromptRef = useRef(initialPrompt);

  const { mutate } = useUpdateConversationTitle();
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ conversationId }),
    }),
    messages: initialMessages,
    onFinish: ({ messages }) => {
      const userMessages = messages.filter(
        (message) => message.role === "user",
      );
      const assistantMessages = messages.filter(
        (message) => message.role === "assistant",
      );

      if (userMessages.length !== 1 || assistantMessages.length !== 1) {
        return;
      }

      mutate({ id: conversationId });
    },
  });

  const isStreaming = status === "submitted" || status === "streaming";

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!initialPromptRef.current) {
      return;
    }

    sendMessage({ text: initialPromptRef.current });
    initialPromptRef.current = undefined;
  }, [sendMessage]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) {
      return;
    }

    sendMessage({ text: input.trim() });
    setInput("");
  };

  const lastMsgId = messages[messages.length - 1]?.id;

  return (
    <ChatLayout
      ref={scrollRef}
      footer={
        <ChatComposer
          value={input}
          isStreaming={isStreaming}
          placeholder={isStreaming ? "답변 생성 중…" : undefined}
          onChange={setInput}
          onSubmit={handleSend}
          onStop={stop}
        />
      }
    >
      <div className="mx-auto max-w-190 space-y-6 px-4 py-6">
        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserBubble key={msg.id} content={getTextContent(msg)} />
          ) : (
            <AssistantBubble
              key={msg.id}
              content={getTextContent(msg)}
              isStreaming={isStreaming && msg.id === lastMsgId}
            />
          ),
        )}
      </div>
    </ChatLayout>
  );
}
