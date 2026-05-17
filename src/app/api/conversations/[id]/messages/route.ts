import { getMessagesByConversation } from "@/server/db/messages/queries";
import { encryption } from "@/server/utils/encryption/aes256gcm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const rows = await getMessagesByConversation(id);

  const messages = rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: encryption.decrypt(row.content),
    createdAt: row.createdAt,
  }));

  return Response.json(messages);
}
