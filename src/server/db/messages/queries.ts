import { asc, eq } from "drizzle-orm";
import { db } from "../index";
import { messages } from "./schema";

interface SaveMessageParams {
  conversationId: string;
  role: "user" | "assistant";
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

export async function getMessagesByConversation(conversationId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));
}
