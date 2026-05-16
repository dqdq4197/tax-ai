import { z } from "zod";

/**
 * 소득세법 제55조 제1항
 * — 2021년 개정으로 8구간 구조 확정 (10억 초과 45% 신설)
 * - 2026년 현재까지 변경 없음
 * @see https://www.law.go.kr/법령/소득세법/(20260421,21548,20260421)/제55조
 */
import brackets2021 from "./2021.json";

const TaxBracketSchema = z.object({
  limit: z.number().positive().nullable(), // null = 상한 없음 (최고 구간)
  rate: z.number().min(0).max(1),
  progressiveDeduction: z.number().min(0),
  label: z.string(),
});

const TaxBracketsSchema = z.array(TaxBracketSchema).min(1);

type TaxBracket = z.infer<typeof TaxBracketSchema>;

const BRACKETS_BY_YEAR: Record<number, unknown> = {
  2023: brackets2021,
  2024: brackets2021,
  2025: brackets2021,
};

export function getTaxBrackets(taxYear: number): TaxBracket[] {
  const raw = BRACKETS_BY_YEAR[taxYear];
  if (!raw) throw new Error(`${taxYear}년 귀속 세율 구간 데이터가 없습니다`);
  return TaxBracketsSchema.parse(raw);
}
