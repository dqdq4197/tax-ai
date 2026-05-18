ALTER TABLE "conversations" ADD COLUMN "anon_id" text;--> statement-breakpoint
ALTER TABLE "law_chunks" ADD COLUMN "content_tsv" "tsvector";--> statement-breakpoint
CREATE INDEX "law_chunks_content_tsv_idx" ON "law_chunks" USING gin ("content_tsv");