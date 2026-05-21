/**
 * data/raw/**\/*.json (parse-hwpx.ts 출력)을 읽어 청킹 후 pgvector DB에 삽입한다.
 * 실행: pnpm db:seed
 *
 * 사전 조건:
 *   - pnpm parse-hwpx 실행 완료 (data/raw/*.json 생성)
 *   - .env.local 에 DATABASE_URL, VOYAGE_API_KEY 설정
 */

import { config } from "dotenv";
import { readFileSync, existsSync } from "fs";

config({ path: ".env.local" });

import { chunkParsedLaw, type ParsedLaw } from "./chunk";
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
    model: "voyage-3.5",
    inputType: "document",
  });
  const embedding = res.data?.[0]?.embedding;
  if (!embedding) throw new Error("Voyage API returned no embedding");
  return embedding;
}

// ─── 파일 목록 ───────────────────────────────────────────────────────────────
//
// 폴더 구조:
//   data/raw/       — parse-hwpx.ts 가 생성한 .json 파일
//
// incomeTypes:
//   []                    — 공통 (소득 유형 무관)
//   ['business', 'freelance'] — 사업/프리랜서 전용
//
// 소득 유형 추가 시: FILES 항목 추가

const FILES: {
  path: string;
  lawVersion: string; // 법령 시행일 (YYYY-MM-DD), 법제처 기준
  incomeTypes: string[];
}[] = [
  // ── 공통 ────────────────────────────────────────────────────────────────
  {
    path: "data/raw/소득세법.json",
    lawVersion: "2026-04-21",
    incomeTypes: [],
  },
  {
    path: "data/raw/소득세법_시행령.json",
    lawVersion: "2026-04-23",
    incomeTypes: [],
  },
  {
    path: "data/raw/소득세법_시행규칙.json",
    lawVersion: "2026-04-21",
    incomeTypes: [],
  },
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

    const parsedLaw: ParsedLaw = JSON.parse(readFileSync(file.path, "utf-8"));
    const chunks = chunkParsedLaw(parsedLaw, file.lawVersion, file.incomeTypes);

    console.log(
      `\n[${parsedLaw.law_name}] ${chunks.length}개 청크 처리 시작...`,
    );

    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.text);

      await db.insert(lawChunks).values({
        content: chunk.text,
        chunkIndex: chunk.metadata.order_index,
        embedding,
        metadata: chunk.metadata,
      });

      process.stdout.write(
        `  저장: ${chunk.metadata.article} [${chunk.metadata.order_index + 1}/${chunks.length}]\r`,
      );
      total++;
    }
    console.log(`  ${parsedLaw.law_name} 완료.                              `);
  }

  console.log(`\n총 ${total}개 청크 삽입 완료.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
