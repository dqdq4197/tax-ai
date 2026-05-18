"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessage } from "ai";
import { useQuery } from "@tanstack/react-query";
import { Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CHAT_API, CONVERSATION_ID_HEADER } from "@/remotes/chat/api";
import { getMessagesQuery } from "@/remotes/conversations/query";
import type { Message } from "@/remotes/schemas";
import ChatComposer from "@/components/chat-composer";

// ── Inline markdown renderer ──────────────────────────────────

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function RichText({ text }: { text: string }) {
  const paras = text.split(/\n\n+/);
  return (
    <>
      {paras.map((para, i) => {
        const lines = para.split("\n");
        const isList = lines.every((l) => l.trim() && /^[\s•\-]/.test(l));
        if (isList) {
          return (
            <ul key={i} className="my-1.5 ml-4 list-disc space-y-0.5">
              {lines.filter(Boolean).map((line, j) => (
                <li key={j}>{renderInline(line.replace(/^[\s•\-]+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="mb-2 last:mb-0">
            {lines.map((line, j) => (
              <span key={j}>
                {renderInline(line)}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}

// ── Message bubbles ───────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] rounded-[18px_18px_6px_18px] bg-secondary px-4 py-3 typo-body2 text-secondary-foreground">
        <RichText text={content} />
      </div>
    </div>
  );
}

function StreamingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  );
}

interface AssistantBubbleProps {
  content: string;
  isStreaming: boolean;
}

function AssistantBubble({ content, isStreaming }: AssistantBubbleProps) {
  return (
    <div className="flex gap-3.5">
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 typo-bold11 tracking-tight text-primary">
        τ
      </div>
      <div className="min-w-0 flex-1">
        <div className="typo-body2 leading-relaxed text-foreground">
          {isStreaming && !content ? (
            <StreamingDots />
          ) : (
            <>
              <RichText text={content} />
              {isStreaming && (
                <span className="ml-0.5 inline-block h-[1em] w-2 animate-pulse rounded-sm bg-primary align-[-2px]" />
              )}
            </>
          )}
        </div>
        {!isStreaming && content && (
          <div className="mt-2 flex gap-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => navigator.clipboard.writeText(content)}
                >
                  <Copy />
                </Button>
              </TooltipTrigger>
              <TooltipContent>복사</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-xs">
                  <ThumbsUp />
                </Button>
              </TooltipTrigger>
              <TooltipContent>좋아요</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-xs">
                  <ThumbsDown />
                </Button>
              </TooltipTrigger>
              <TooltipContent>싫어요</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────

function ChatSkeleton() {
  return (
    <div className="mx-auto max-w-[760px] space-y-8 px-4 py-8">
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

// ── Transport factory (outside component to satisfy React Compiler) ───────────

function createTransport(conversationIdRef: { current: string | undefined }) {
  return new DefaultChatTransport({
    api: CHAT_API,
    fetch: async (url, init) => {
      if (init?.body && typeof init.body === "string") {
        try {
          const parsed = JSON.parse(init.body);
          if (conversationIdRef.current) {
            parsed.conversationId = conversationIdRef.current;
          }
          (init as RequestInit).body = JSON.stringify(parsed);
        } catch {
          // noop
        }
      }

      const res = await globalThis.fetch(
        url as RequestInfo,
        init as RequestInit,
      );

      const id = res.headers.get(CONVERSATION_ID_HEADER);
      if (id) {
        conversationIdRef.current = id;
        window.history.replaceState({}, "", `/chat/${id}`);
      }

      return res;
    },
  });
}

// ── Main chat logic ───────────────────────────────────────────

function getTextContent(msg: UIMessage): string {
  return msg.parts
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join("");
}

function toUIMessage(m: Message): UIMessage {
  return {
    id: m.id,
    role: m.role,
    parts: [{ type: "text", text: m.content }],
  };
}

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: UIMessage[];
  initialPrompt?: string;
}

function ChatInterface({
  conversationId,
  initialMessages,
  initialPrompt,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [conversationIdBox] = useState<{ current: string | undefined }>(() => ({
    current: conversationId,
  }));
  const hasSubmittedRef = useRef(false);
  const [transport] = useState(() => createTransport(conversationIdBox));

  const { messages, sendMessage, status, stop } = useChat({
    transport,
    messages: initialMessages,
  });

  const isStreaming = status === "submitted" || status === "streaming";

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-submit the initial prompt from the home page once on mount
  useEffect(() => {
    if (initialPrompt && !hasSubmittedRef.current && messages.length === 0) {
      hasSubmittedRef.current = true;
      sendMessage({ text: initialPrompt });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    sendMessage({ text: input.trim() });
    setInput("");
  }, [input, isStreaming, sendMessage]);

  const lastMsg = messages[messages.length - 1];

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-44">
        <div className="mx-auto max-w-[760px] space-y-6 px-4 py-6">
          {messages.map((msg) => {
            const msgIsStreaming =
              isStreaming && msg === lastMsg && msg.role === "assistant";
            return (
              <div key={msg.id} className="group/msg">
                {msg.role === "user" ? (
                  <UserBubble content={getTextContent(msg)} />
                ) : (
                  <AssistantBubble
                    content={getTextContent(msg)}
                    isStreaming={msgIsStreaming}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-b from-transparent via-background/80 to-background px-4 pb-6 pt-16">
        <div className="mx-auto max-w-190">
          <ChatComposer
            value={input}
            isStreaming={isStreaming}
            placeholder={
              isStreaming ? "답변 생성 중…" : "세금에 대해 무엇이든 물어보세요"
            }
            onChange={setInput}
            onSubmit={handleSend}
            onStop={stop}
          />
        </div>
      </div>
    </div>
  );
}

// ── Route entry points ────────────────────────────────────────

interface Props {
  conversationId: string;
  initialPrompt?: string;
}

function ExistingChatLoader({ conversationId }: { conversationId: string }) {
  const { data, isLoading, isError } = useQuery(
    getMessagesQuery({ conversationId }),
  );

  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <ChatSkeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="typo-body2 text-muted-foreground">
          대화를 불러올 수 없어요.
        </p>
      </div>
    );
  }

  return (
    <ChatInterface
      key={conversationId}
      conversationId={conversationId}
      initialMessages={data?.map(toUIMessage)}
    />
  );
}

export default function ChatView({ conversationId, initialPrompt }: Props) {
  if (conversationId === "new") {
    return <ChatInterface key="new" initialPrompt={initialPrompt} />;
  }
  return <ExistingChatLoader conversationId={conversationId} />;
}
