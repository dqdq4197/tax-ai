import { and, or, sql } from "drizzle-orm";

import { parseArticleRef } from "@/utils/law-sources";
import { db } from "../index";
import { lawChunks } from "./schema";

const VECTOR_THRESHOLD_HYBRID = 0.3;
const MIN_HYBRID_SCORE = 0.05;
const DEFAULT_LIMIT = 5;

export async function searchLawChunks(
  embedding: number[],
  queryText: string,
  limit = DEFAULT_LIMIT,
) {
  const vec = JSON.stringify(embedding);
  const bm25OrQuery = queryText.trim().split(/\s+/).join(" | ");
  const hybridScore = sql<number>`
    (1 - (${lawChunks.embedding} <=> ${vec}::vector)) * 0.7
    + ts_rank_cd(${lawChunks.contentTsv}, websearch_to_tsquery('simple', ${queryText})) * 0.3`;

  return db
    .select({
      content: lawChunks.content,
      metadata: lawChunks.metadata,
      similarity: hybridScore,
    })
    .from(lawChunks)
    .where(
      and(
        or(
          sql`1 - (${lawChunks.embedding} <=> ${vec}::vector) > ${VECTOR_THRESHOLD_HYBRID}`,
          // BM25 후보 필터: 단어 중 하나라도 포함된 청크를 후보로 올림
          sql`${lawChunks.contentTsv} @@ to_tsquery('simple', ${bm25OrQuery})`,
        ),
        sql`(1 - (${lawChunks.embedding} <=> ${vec}::vector)) * 0.7
            + ts_rank_cd(${lawChunks.contentTsv}, websearch_to_tsquery('simple', ${queryText})) * 0.3
            > ${MIN_HYBRID_SCORE}`,
      ),
    )
    .orderBy(
      sql`(1 - (${lawChunks.embedding} <=> ${vec}::vector)) * 0.7
          + ts_rank_cd(${lawChunks.contentTsv}, websearch_to_tsquery('simple', ${queryText})) * 0.3 DESC`,
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
