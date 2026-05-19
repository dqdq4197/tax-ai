import { and, asc, count, eq, isNull, ne, or } from "drizzle-orm";
import { db } from "../index";
import { messages, type MessageStatus, type Role } from "./schema";

interface SaveMessageParams {
  conversationId: string;
  role: Role;
  status?: MessageStatus;
  model?: string;
  content: string;
  toolCalls?: unknown[];
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  finishReason?: string;
  traceId?: string;
}

export async function saveMessage(params: SaveMessageParams) {
  const [message] = await db
    .insert(messages)
    .values({
      conversationId: params.conversationId,
      role: params.role,
      status: params.status ?? null,
      model: params.model ?? null,
      content: params.content,
      toolCalls: params.toolCalls ?? null,
      durationMs: params.durationMs ?? null,
      inputTokens: params.inputTokens ?? null,
      outputTokens: params.outputTokens ?? null,
      finishReason: params.finishReason ?? null,
      traceId: params.traceId ?? null,
    })
    .returning();
  return message;
}

interface FinalizeAssistantMessageParams {
  content: string;
  status: "complete" | "error";
  model?: string;
  toolCalls?: unknown[];
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  finishReason?: string;
}

export async function finalizeAssistantMessage(
  id: string,
  params: FinalizeAssistantMessageParams,
) {
  // status='generating'인 경우에만 업데이트 — 다른 탭이 이미 'abandoned'으로 마킹한
  // placeholder를 재활성화하는 race condition 방지.
  const [msg] = await db
    .update(messages)
    .set({
      content: params.content,
      status: params.status,
      model: params.model ?? null,
      toolCalls: params.toolCalls ?? null,
      durationMs: params.durationMs ?? null,
      inputTokens: params.inputTokens ?? null,
      outputTokens: params.outputTokens ?? null,
      finishReason: params.finishReason ?? null,
    })
    .where(and(eq(messages.id, id), eq(messages.status, "generating")))
    .returning({ id: messages.id, conversationId: messages.conversationId });

  // 같은 대화의 고아(orphaned) 'generating' 메시지를 abandoned으로 마킹.
  // 멀티탭·재시도 race condition에서 중복 응답 저장을 방지.
  if (msg && params.status === "complete") {
    await db
      .update(messages)
      .set({ status: "abandoned" })
      .where(
        and(
          eq(messages.conversationId, msg.conversationId),
          eq(messages.role, "assistant"),
          eq(messages.status, "generating"),
          ne(messages.id, id),
        ),
      );
  }
}

export async function getCountUserMessages(
  conversationId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.role, "user"),
      ),
    );
  return row?.value ?? 0;
}

export async function getMessagesByConversation(conversationId: string) {
  return db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        or(isNull(messages.status), ne(messages.status, "abandoned")),
      ),
    )
    .orderBy(asc(messages.createdAt));
}
