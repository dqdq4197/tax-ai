import { and, or, sql } from "drizzle-orm";

import { parseArticleRef } from "@/utils/law-sources";
import { db } from "../index";
import { lawChunks } from "./schema";

const VECTOR_THRESHOLD = 0.6;
const VECTOR_THRESHOLD_HYBRID = 0.4; // BM25가 보완하므로 완화
const DEFAULT_LIMIT = 5;

export type ChunkType =
  | "definition"
  | "rule"
  | "exception"
  | "procedure"
  | "mixed";

export async function searchLawChunks(
  embedding: number[],
  incomeType: string,
  limit = DEFAULT_LIMIT,
  chunkType?: ChunkType,
  queryText?: string,
) {
  const vec = JSON.stringify(embedding);

  // queryText가 있으면 hybrid(BM25 0.3 + vector 0.7), 없으면 vector only
  const scoreExpr = queryText
    ? sql<number>`(1 - (${lawChunks.embedding} <=> ${vec}::vector)) * 0.7
        + ts_rank_cd(${lawChunks.contentTsv}, websearch_to_tsquery('simple', ${queryText})) * 0.3`
    : sql<number>`1 - (${lawChunks.embedding} <=> ${vec}::vector)`;

  const candidateFilter = queryText
    ? or(
        sql`1 - (${lawChunks.embedding} <=> ${vec}::vector) > ${VECTOR_THRESHOLD_HYBRID}`,
        sql`${lawChunks.contentTsv} @@ websearch_to_tsquery('simple', ${queryText})`,
      )
    : sql`1 - (${lawChunks.embedding} <=> ${vec}::vector) > ${VECTOR_THRESHOLD}`;

  return db
    .select({
      content: lawChunks.content,
      metadata: lawChunks.metadata,
      similarity: scoreExpr,
    })
    .from(lawChunks)
    .where(
      and(
        candidateFilter,
        sql`${lawChunks.metadata}->'incomeTypes' = '[]'::jsonb
            OR ${lawChunks.metadata}->'incomeTypes' ? ${incomeType}`,
        chunkType
          ? sql`${lawChunks.metadata}->>'chunk_type' = ${chunkType}`
          : undefined,
      ),
    )
    .orderBy(
      queryText
        ? sql`(1 - (${lawChunks.embedding} <=> ${vec}::vector)) * 0.7
            + ts_rank_cd(${lawChunks.contentTsv}, websearch_to_tsquery('simple', ${queryText})) * 0.3 DESC`
        : sql`${lawChunks.embedding} <=> ${vec}::vector`,
    )
    .limit(limit);
}

export async function getLawChunksByArticle(articles: string[]) {
  if (articles.length === 0) {
    return [];
  }

  const conditions = articles.map((article) => {
    const { source, articleNum } = parseArticleRef(article);
    const articleCond = sql`${lawChunks.metadata}->>'article' ILIKE ${articleNum + "%"}`;

    if (!source) {
      return articleCond;
    }

    return sql`(${articleCond} AND ${lawChunks.metadata}->>'source' = ${source})`;
  });

  return db
    .select({ content: lawChunks.content, metadata: lawChunks.metadata })
    .from(lawChunks)
    .where(or(...conditions))
    .orderBy(
      sql`${lawChunks.metadata}->>'source'`,
      sql`${lawChunks.metadata}->>'article'`,
    );
}
