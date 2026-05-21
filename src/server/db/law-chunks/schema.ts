import {
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const lawChunks = pgTable(
  "law_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    content: text("content").notNull(),
    chunkIndex: integer("chunk_index").notNull().default(0),
    embedding: vector("embedding", { dimensions: 1024 }).notNull(),
    // GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED — DB 레벨 자동 생성, 삽입 불가
    contentTsv: tsvector("content_tsv"),
    metadata: jsonb("metadata")
      .$type<{
        source: string;
        article: string;
        title: string;
        lawVersion: string; // 법령 시행일 (YYYY-MM-DD), 법제처 기준
        incomeTypes: string[];
        paragraph: string;
        chunk_type: "definition" | "rule" | "exception" | "procedure" | "mixed";
        parent_article: string;
        references: string[];
        keywords: string[];
        token_estimate: number;
        order_index: number;
        chapter: string | null;
        section: string | null;
      }>()
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("law_chunks_embedding_idx")
      .using("hnsw", table.embedding.op("vector_cosine_ops"))
      .with({ m: 16, ef_construction: 64 }),
    index("law_chunks_metadata_idx").using("gin", table.metadata),
    index("law_chunks_content_tsv_idx").using("gin", table.contentTsv),
  ],
);
