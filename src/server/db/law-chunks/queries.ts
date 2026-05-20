import { and, or, sql } from "drizzle-orm";

import { parseArticleRef } from "@/utils/law-sources";
import { db } from "../index";
import { lawChunks } from "./schema";

const SIMILARITY_THRESHOLD = 0.7;
const DEFAULT_LIMIT = 5;

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
