import { and, sql } from "drizzle-orm";
import { db } from "../index";
import { lawChunks } from "./schema";

const SIMILARITY_THRESHOLD = 0.7;
const DEFAULT_LIMIT = 5;

type InsertLawChunkParams = {
  content: string;
  chunkIndex: number;
  embedding: number[];
  metadata: {
    source: string;
    article: string;
    title: string;
    year: number;
    incomeTypes: string[];
  };
};

export async function insertLawChunk(params: InsertLawChunkParams) {
  await db.insert(lawChunks).values(params);
}

export async function deleteAllLawChunks() {
  await db.delete(lawChunks);
}

export async function searchLawChunks(
  embedding: number[],
  incomeType: string,
  limit = DEFAULT_LIMIT,
) {
  return db
    .select({
      content: lawChunks.content,
      metadata: lawChunks.metadata,
      similarity: sql<number>`1 - (${lawChunks.embedding} <=> ${JSON.stringify(embedding)}::vector)`,
    })
    .from(lawChunks)
    .where(
      and(
        sql`1 - (${lawChunks.embedding} <=> ${JSON.stringify(embedding)}::vector) > ${SIMILARITY_THRESHOLD}`,
        sql`${lawChunks.metadata}->'incomeTypes' = '[]'::jsonb
            OR ${lawChunks.metadata}->'incomeTypes' ? ${incomeType}`,
      ),
    )
    .orderBy(
      sql`${lawChunks.embedding} <=> ${JSON.stringify(embedding)}::vector`,
    )
    .limit(limit);
}
