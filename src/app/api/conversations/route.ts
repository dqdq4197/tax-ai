import { listConversations } from "@/server/db/conversations/queries";
import { encryption } from "@/server/utils/encryption/aes256gcm";

export async function GET() {
  const rows = await listConversations();

  const conversations = rows.map((row) => ({
    id: row.id,
    title: row.title,
    firstMessage: row.firstMessage
      ? encryption.decrypt(row.firstMessage)
      : null,
    createdAt: row.createdAt,
  }));

  return Response.json(conversations);
}
