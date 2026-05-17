ALTER TABLE "law_chunks"
  ADD COLUMN "content_tsv" tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', "content")) STORED;
--> statement-breakpoint
CREATE INDEX "law_chunks_content_tsv_idx" ON "law_chunks" USING gin ("content_tsv");
