import { listConversations } from "@/server/db/conversations/queries";
import { encryption } from "@/server/utils/encryption/aes256gcm";
import { getAnonId } from "@/server/utils/session";

export async function GET() {
  const anonId = await getAnonId();

  if (!anonId) {
    return Response.json([]);
  }

  const rows = await listConversations(anonId);

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
