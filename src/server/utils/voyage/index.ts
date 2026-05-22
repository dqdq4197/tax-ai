import { createRequire } from "node:module";

/**
 * voyageai ESM 빌드가 extensionless import 버그로 broken — CJS 강제 로드
 * @see https://github.com/voyage-ai/typescript-sdk/issues/26
 */
const { VoyageAIClient } = createRequire(import.meta.url)("voyageai");

const client = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY,
});

export async function getEmbedding(text: string): Promise<number[]> {
  const res = await client.embed({
    input: text,
    model: "voyage-3.5",
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
    model: "voyage-3.5",
    inputType: "query",
  });
  const embedding = res.data?.[0]?.embedding;

  if (!embedding) {
    throw new Error("Voyage API returned no embedding");
  }

  return embedding;
}
