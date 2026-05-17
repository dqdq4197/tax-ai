/**
 * 세법 텍스트를 pgvector DB에 삽입하는 시드 스크립트.
 * 실행: pnpm db:seed
 *
 * 사전 조건:
 *   - data/laws/ 에 텍스트 파일 배치 (아래 FILES 목록 참고)
 *   - .env.local 에 DATABASE_URL, VOYAGE_API_KEY 설정
 */

import { config } from "dotenv";
import { readFileSync, existsSync } from "fs";

config({ path: ".env.local" });

import { chunkByArticle } from "./chunk";
import { VoyageAIClient } from "voyageai";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { lawChunks } from "../src/server/db/law-chunks/schema";

// ─── 클라이언트 초기화 ────────────────────────────────────────────────────────

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY! });
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// ─── 임베딩 요청 (document type) ──────────────────────────────────────────────

async function getEmbedding(text: string): Promise<number[]> {
  const res = await voyage.embed({
    input: text,
    model: "voyage-3",
    inputType: "document",
  });
  const embedding = res.data?.[0]?.embedding;
  if (!embedding) throw new Error("Voyage API returned no embedding");
  return embedding;
}

// ─── 파일 목록 ───────────────────────────────────────────────────────────────
//
// 폴더 구조:
//   data/laws/common/    — 공통 조항 (incomeTypes: [])
//   data/laws/business/  — 사업소득 전용 (incomeTypes: ['business', 'freelance'])
//   data/laws/employment/— 근로소득 전용 (추후 추가 시)
//
// 소득 유형 추가 시: 폴더 생성 + FILES 항목 추가

const FILES: {
  path: string;
  source: string;
  lawVersion: string; // 법령 시행일 (YYYY-MM-DD), 법제처 기준
  incomeTypes: string[];
}[] = [
  // ── 공통 ────────────────────────────────────────────────────────────────
  {
    path: "data/laws/common/소득세법.txt",
    source: "소득세법",
    lawVersion: "2026-04-21",
    incomeTypes: [],
  },
  {
    path: "data/laws/common/소득세법_시행령.txt",
    source: "소득세법 시행령",
    lawVersion: "2026-04-23",
    incomeTypes: [],
  },
  // ── 근로소득 (추후) ───────────────────────────────────────────────────────
  // {
  //   path: "data/laws/employment/근로소득_공제.txt",
  //   source: "소득세법",
  //   lawVersion: "YYYY-MM-DD",
  //   incomeTypes: ["employment"],
  // },
];

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("기존 데이터 삭제 중...");
  await db.delete(lawChunks);
  console.log("완료.");

  let total = 0;

  for (const file of FILES) {
    if (!existsSync(file.path)) {
      console.warn(`[SKIP] 파일 없음: ${file.path}`);
      continue;
    }

    const text = readFileSync(file.path, "utf-8");
    const chunks = chunkByArticle(text);

    console.log(`\n[${file.source}] ${chunks.length}개 청크 처리 시작...`);

    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.content);

      await db.insert(lawChunks).values({
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        embedding,
        metadata: {
          source: file.source,
          article: chunk.article,
          title: chunk.title,
          lawVersion: file.lawVersion,
          incomeTypes: file.incomeTypes,
        },
      });

      process.stdout.write(
        `  저장: ${chunk.article} (${chunk.title}) [${chunk.chunkIndex + 1}/${chunks.length}]\r`,
      );
      total++;
    }
    console.log(`  ${file.source} 완료.                              `);
  }

  console.log(`\n총 ${total}개 청크 삽입 완료.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
