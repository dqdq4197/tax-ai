import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { getMessagesByConversation } from "@/server/db/messages/queries";
import { updateConversationTitle } from "@/server/db/conversations/queries";
import { encryption } from "@/server/utils/encryption/aes256gcm";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const dbMessages = await getMessagesByConversation(id);
  const firstUser = dbMessages.find((message) => message.role === "user");
  const firstAssistant = dbMessages.find(
    (message) => message.role === "assistant" && message.status === "complete",
  );

  if (!firstUser) {
    return new Response(null, { status: 204 });
  }

  const firstMessage = encryption.decrypt(firstUser.content);
  const firstResponse = firstAssistant
    ? encryption.decrypt(firstAssistant.content).slice(0, 300)
    : undefined;

  const context = firstResponse
    ? `질문: ${firstMessage}\n\n답변 요약: ${firstResponse}`
    : `질문: ${firstMessage}`;

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: `다음 세금 상담 대화의 핵심을 담은 제목을 한국어로 15자 이내로 작성하세요. 마침표·따옴표 없이 제목만 출력하세요.\n\n${context}`,
    maxOutputTokens: 500,
    onFinish: (data) => {
      console.log(data);
    },
  });

  console.log(text);

  await updateConversationTitle(id, text.trim());
  return new Response(null, { status: 204 });
}
