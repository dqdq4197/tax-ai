import {
  getConversationByShareId,
} from "@/server/db/conversations/queries";
import { getMessagesByConversation } from "@/server/db/messages/queries";
import { encryption } from "@/server/utils/encryption/aes256gcm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const conversation = await getConversationByShareId(token);
  if (!conversation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await getMessagesByConversation(conversation.id);

  const messages = rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: encryption.decrypt(row.content),
    createdAt: row.createdAt,
  }));

  return Response.json({
    title: conversation.title,
    messages,
  });
}
