import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { updateConversationTitle } from "@/server/db/conversations/queries";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { firstMessage, firstResponse } = await req.json();

  const context = firstResponse
    ? `질문: ${firstMessage}\n\n답변 요약: ${firstResponse.slice(0, 300)}`
    : `질문: ${firstMessage}`;

  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt: `다음 세금 상담 대화의 핵심을 담은 제목을 한국어로 15자 이내로 작성하세요. 마침표·따옴표 없이 제목만 출력하세요.\n\n${context}`,
    maxOutputTokens: 30,
  });

  await updateConversationTitle(id, text.trim());
  return new Response(null, { status: 204 });
}
