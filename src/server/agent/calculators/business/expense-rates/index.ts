import { z } from "zod";
// 국세청고시 제2024-9호  — 2023년 귀속 경비율 (references/2023년 귀속 기준경비율 단순경비율.pdf)
// 국세청고시 제2025-6호  — 2024년 귀속 경비율 (references/2024년 귀속 기준경비율 단순경비율.pdf)
// 국세청고시 제2026-XX호 — 2025년 귀속 경비율 (references/2025년 귀속 기준경비율 단순경비율_최종.pdf)
// 2026년 귀속 이후: 해당 연도 고시 발행 후 references/에 PDF 추가 후 동일 방식으로 파싱
import rates2023 from "./2023.json";
import rates2024 from "./2024.json";
import rates2025 from "./2025.json";

const ExpenseRateSchema = z.object({
  code: z.string(),
  category: z.string(),
  name: z.string(),
  incomeGroup: z.enum(["가", "나", "다"]),
  simpleRateGeneral: z.number().min(0).max(100),
  simpleRateExcess: z.number().min(0).max(100),
  standardRate: z.number().min(0).max(100),
});

const ExpenseRatesSchema = z.array(ExpenseRateSchema).min(1);

type ExpenseRate = z.infer<typeof ExpenseRateSchema>;

const RATES_BY_YEAR: Record<number, unknown> = {
  2023: rates2023,
  2024: rates2024,
  2025: rates2025,
};

const cache = new Map<number, Map<string, ExpenseRate>>();

export function getExpenseRateMap(taxYear: number): Map<string, ExpenseRate> {
  if (cache.has(taxYear)) return cache.get(taxYear)!;

  const raw = RATES_BY_YEAR[taxYear];
  if (!raw) throw new Error(`${taxYear}년 귀속 경비율 데이터가 없습니다`);

  const rates = ExpenseRatesSchema.parse(raw);
  const map = new Map(rates.map((r) => [r.code, r]));
  cache.set(taxYear, map);
  return map;
}

export function getExpenseRate(
  taxYear: number,
  businessCode: string,
): ExpenseRate {
  const map = getExpenseRateMap(taxYear);
  const entry = map.get(businessCode);
  if (!entry)
    throw new Error(
      `등록되지 않은 업종코드입니다: ${businessCode} (${taxYear}년)`,
    );
  return entry;
}
