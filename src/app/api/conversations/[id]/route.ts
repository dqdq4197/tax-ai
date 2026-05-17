import {
  deleteConversation,
  updateConversationTitle,
} from "@/server/db/conversations/queries";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { title } = await req.json();

  await updateConversationTitle(id, title);

  return new Response(null, { status: 204 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  await deleteConversation(id);

  return new Response(null, { status: 204 });
}
