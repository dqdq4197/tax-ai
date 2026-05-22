import { tool } from "ai";
import { z } from "zod";
import { calculate } from "./calculators";
import { verifyResult } from "./calculators/business/verify";
import { getQueryEmbedding } from "../utils/voyage";
import {
  getLawChunksByArticle,
  searchLawChunks,
} from "../db/law-chunks/queries";

export const tools = {
  vector_search: tool({
    description:
      "사용자의 질문과 관련된 세법 조항을 검색합니다." +
      "비형식적 용어는 반드시 소득세법 공식 용어로 치환하여 검색을 수행하세요.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "구어체·직업명 등 일상 용어를 법령 원문에 실제 등장하는 세법 용어로 변환한 검색어. " +
            "예: '유튜버' → '인적용역 사업소득', '배달기사' → '운송업 인적용역'",
        ),
    }),
    execute: async ({ query }) => {
      const embedding = await getQueryEmbedding(query);
      const chunks = await searchLawChunks(embedding, query);
      return chunks.map((c) => ({
        law: c.metadata.source,
        article: c.metadata.article,
        paragraph: c.metadata.paragraph,
        content: c.content,
        similarity: c.similarity,
      }));
    },
  }),

  law_article_lookup: tool({
    description:
      "조항 번호로 법령 원문을 직접 조회합니다. 사용자가 특정 조항을 언급하거나 원문 전체가 필요할 때 사용하세요. vector_search 대신 사용하세요.",
    inputSchema: z.object({
      articles: z
        .array(z.string())
        .describe(
          "조회할 조항명 목록 (예: ['소득세법 제70조', '소득세법 제73조'])",
        ),
    }),
    execute: async ({ articles }) => {
      const chunks = await getLawChunksByArticle(articles);
      return chunks.map((chunk) => ({
        law: chunk.metadata.source,
        article: chunk.metadata.article,
        paragraph: chunk.metadata.paragraph,
        title: chunk.metadata.title,
        content: chunk.content,
      }));
    },
  }),

  tax_calculator: tool({
    description:
      "종합소득세를 계산합니다. 필요한 정보를 모두 수집한 후 호출하세요. 절대 직접 계산하지 마세요.",
    inputSchema: z.object({
      incomeType: z.enum(["business", "freelance"]).describe("소득 유형"),
      taxYear: z.number().int().describe("귀속 연도 (2023, 2024, 2025)"),
      businessCode: z.string().describe("국세청 업종코드 6자리 (예: '940926')"),
      totalIncome: z.number().int().min(0).describe("당해연도 총수입금액 (원)"),
      previousYearIncome: z
        .number()
        .int()
        .min(0)
        .describe("직전연도 수입금액 (원). 신규 사업자는 0"),
      dependents: z
        .number()
        .int()
        .min(0)
        .describe("기본공제 부양가족 수 (본인 제외)"),
      incomeDeductions: z.object({
        nationalPension: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("국민연금 납입액 (원)"),
      }),
      majorExpenses: z
        .object({
          purchases: z.number().int().min(0).describe("매입비용 (원)"),
          rent: z.number().int().min(0).describe("임차료 (원)"),
          laborCost: z.number().int().min(0).describe("인건비 (원)"),
        })
        .optional()
        .describe("주요경비 — 기준경비율 방식 적용 시 필요"),
      stabilityFund: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("일자리안정자금 수령액 (원)"),
    }),
    execute: async (input) => {
      const result = calculate(input);
      verifyResult(input, result);
      return result;
    },
  }),
} as const;
