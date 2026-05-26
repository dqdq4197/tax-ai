import { and, or, sql } from "drizzle-orm";

import { parseArticleRef } from "@/utils/law-sources";
import { db } from "../index";
import { lawChunks } from "./schema";

const VECTOR_SIMILARITY_THRESHOLD = 0.3;
const MIN_HYBRID_SCORE = 0.05;
const DEFAULT_LIMIT = 5;

export async function searchLawChunks(
  embedding: number[],
  queryText: string,
  limit = DEFAULT_LIMIT,
) {
  const vec = JSON.stringify(embedding);
  const bm25OrQuery = queryText.trim().split(/\s+/).join(" | ");
  const bm25Score = sql<number>`ts_rank_cd(${lawChunks.contentTsv}, websearch_to_tsquery('simple', ${queryText}))`;
  const hybridScore = sql<number>`
    (1 - (${lawChunks.embedding} <=> ${vec}::vector)) * 0.7
    + (${bm25Score} / (${bm25Score} + 0.1)) * 0.2`;

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
          // 벡터 유사도 필터: 벡터 유사도가 0.3 이상인 청크를 후보로 올림
          sql`1 - (${lawChunks.embedding} <=> ${vec}::vector) > ${VECTOR_SIMILARITY_THRESHOLD}`,
          // BM25 후보 필터: 단어 중 하나라도 포함된 청크를 후보로 올림
          sql`${lawChunks.contentTsv} @@ to_tsquery('simple', ${bm25OrQuery})`,
        ),
        sql`${hybridScore} > ${MIN_HYBRID_SCORE}`,
      ),
    )
    .orderBy(sql`${hybridScore} DESC`)
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
