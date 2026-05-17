import {
  createShareLink,
  revokeShareLink,
} from "@/server/db/conversations/queries";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const shareId = await createShareLink(id);
  const shareUrl = `/share/${shareId}`;

  return Response.json({ shareUrl });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  await revokeShareLink(id);

  return new Response(null, { status: 204 });
}
