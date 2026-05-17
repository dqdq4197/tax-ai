// import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { GoogleGenerativeAIModelId } from "@ai-sdk/google/internal";
import { stepCountIs, streamText } from "ai";
import { createConversation } from "@/server/db/conversations/queries";
import { saveMessage } from "@/server/db/messages/queries";
import { tools } from "@/server/agent/tools";
import { systemPrompt } from "@/server/agent/prompts";
import { encryption } from "@/server/utils/encryption/aes256gcm";
import { langfuse } from "@/server/utils/langfuse";

const MODEL: GoogleGenerativeAIModelId = "gemini-2.5-flash";

export async function POST(req: Request) {
  const { messages, conversationId: existingId } = await req.json();

  const conversationId = existingId ?? (await createConversation());
  const startedAt = Date.now();

  const trace = langfuse.trace({
    name: "chat",
    sessionId: conversationId,
    input: { messages },
  });

  const userMessage = messages.at(-1);
  await saveMessage({
    conversationId,
    role: "user",
    content: encryption.encrypt(userMessage.content),
    traceId: trace.id,
  });

  const result = streamText({
    model: google(MODEL),
    system: systemPrompt,
    messages,
    tools,
    stopWhen: stepCountIs(10),
    onFinish: async (event) => {
      const allToolCalls = event.steps.flatMap((s) => s.toolCalls);

      await saveMessage({
        conversationId,
        role: "assistant",
        model: MODEL,
        content: encryption.encrypt(event.text),
        toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
        durationMs: Date.now() - startedAt,
        inputTokens: event.totalUsage.inputTokens,
        outputTokens: event.totalUsage.outputTokens,
        finishReason: event.finishReason,
        traceId: trace.id,
      });

      trace.update({ output: { text: event.text } });
      await langfuse.flushAsync();
    },
  });

  return result.toUIMessageStreamResponse({
    headers: { "X-Conversation-Id": conversationId },
  });
}
