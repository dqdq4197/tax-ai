import { getLawChunksByArticle } from "@/server/db/law-chunks/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref")?.trim();

  if (!ref) {
    return Response.json(null, { status: 400 });
  }

  const chunks = await getLawChunksByArticle([ref]);

  const content = chunks.map((chunk) => chunk.content).join("\n\n") || null;

  return Response.json({ article: ref, content });
}
