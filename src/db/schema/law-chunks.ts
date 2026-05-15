import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";

export const lawChunks = pgTable(
  "law_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1024 }).notNull(),
    metadata: jsonb("metadata")
      .$type<{
        source: string;
        article: string;
        title: string;
        year: number;
        incomeTypes: string[];
      }>()
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("law_chunks_embedding_idx")
      .using("hnsw", table.embedding.op("vector_cosine_ops"))
      .with({ m: 16, ef_construction: 64 }),
  ]
);
