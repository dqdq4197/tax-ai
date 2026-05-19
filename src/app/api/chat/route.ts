import { google } from "@ai-sdk/google";
import { GoogleGenerativeAIModelId } from "@ai-sdk/google/internal";
import {
  convertToModelMessages,
  isTextUIPart,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { createConversation } from "@/server/db/conversations/queries";
import {
  finalizeAssistantMessage,
  getCountUserMessages,
  saveMessage,
} from "@/server/db/messages/queries";
import { tools } from "@/server/agent/tools";
import { systemPrompt } from "@/server/agent/prompts";
import { encryption } from "@/server/utils/encryption/aes256gcm";
import { langfuse } from "@/server/utils/langfuse";
import { getAnonId } from "@/server/utils/session";

const MODEL: GoogleGenerativeAIModelId = "gemini-2.5-flash";

export async function POST(req: Request) {
  const {
    messages,
    conversationId: existingId,
  }: { messages: UIMessage[]; conversationId?: string } = await req.json();

  const anonId = await getAnonId();
  const conversationId =
    existingId ?? (await createConversation(anonId ?? "anonymous"));
  const startedAt = Date.now();

  const trace = langfuse.trace({
    name: "chat",
    sessionId: conversationId,
    input: { messages },
  });

  // incoming user 메시지 수가 DB보다 많을 때만 저장 — resume/retry 경로의 중복 저장 방지.
  const incomingUserCount = messages.filter(
    (message) => message.role === "user",
  ).length;
  const dbUserCount = await getCountUserMessages(conversationId);

  if (incomingUserCount > dbUserCount) {
    const userMessage = messages.at(-1);
    const content =
      userMessage?.parts
        .filter(isTextUIPart)
        .map((p) => p.text)
        .join("") ?? "";

    await saveMessage({
      conversationId,
      role: "user",
      content: encryption.encrypt(content),
      traceId: trace.id,
    });
  }

  // 새로고침 시 생성 중단 여부를 감지할 수 있도록 placeholder를 선저장.
  const assistantPlaceholder = await saveMessage({
    conversationId,
    role: "assistant",
    content: encryption.encrypt(""),
    status: "generating",
    traceId: trace.id,
  });

  const result = streamText({
    model: google(MODEL),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(10),
    onFinish: async (event) => {
      const allToolCalls = event.steps.flatMap((s) => s.toolCalls);

      await finalizeAssistantMessage(assistantPlaceholder.id, {
        content: encryption.encrypt(event.text),
        status: "complete",
        model: MODEL,
        toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
        durationMs: Date.now() - startedAt,
        inputTokens: event.totalUsage.inputTokens,
        outputTokens: event.totalUsage.outputTokens,
        finishReason: event.finishReason,
      });

      trace.update({ output: { text: event.text } });
      await langfuse.flushAsync();
    },
  });

  return result.toUIMessageStreamResponse({
    headers: { "X-Conversation-Id": conversationId },
  });
}
