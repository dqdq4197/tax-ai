import { VoyageAIClient } from "voyageai";

const client = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY,
});

export async function getEmbedding(text: string): Promise<number[]> {
  const res = await client.embed({
    input: text,
    model: "voyage-3",
    inputType: "document",
  });
  const embedding = res.data?.[0]?.embedding;

  if (!embedding) {
    throw new Error("Voyage API returned no embedding");
  }

  return embedding;
}

export async function getQueryEmbedding(text: string): Promise<number[]> {
  const res = await client.embed({
    input: text,
    model: "voyage-3",
    inputType: "query",
  });
  const embedding = res.data?.[0]?.embedding;

  if (!embedding) {
    throw new Error("Voyage API returned no embedding");
  }

  return embedding;
}
