// 소득세법 시행령 제143조④ — 단순경비율 적용대상자 기준, 2023년 이후 변경 없음

import type { IncomeGroup } from "../types";

type Thresholds = {
  /**
   * 직전 과세기간 수입금액 기준 — 제143조④제2호
   * 이 금액 미만이어야 단순경비율 적용 가능 (신규 사업자는 조건 면제)
   * @see https://law.go.kr/법령/소득세법시행령/제143조
   */
  prevYearLimit: Record<IncomeGroup, number>;

  /**
   * 해당 과세기간(당해연도) 수입금액 기준 — 제143조④ 본문, 제208조⑤제2호 금액 준용
   * 당해연도 수입이 이 금액 이상이면 직전연도 조건 충족 여부와 무관하게 단순경비율 불가
   * @see https://law.go.kr/법령/소득세법시행령/제208조
   */
  currentYearLimit: Record<IncomeGroup, number>;

  /**
   * 인적용역(94****) 단순경비율 기본율/초과율 분기점
   * 근거: 국세청 고시 경비율 고시 총칙 "다. 인적용역 제공사업자(94****)의 단순경비율(기본율·초과율) 적용"
   * "수입금액이 4천만원까지는 기본율을 적용하고 4천만원을 초과하는 금액에 대하여는 초과율을 적용한다."
   */
  splitThreshold: number;
};

const thresholds2023: Thresholds = {
  prevYearLimit: { 가: 60_000_000, 나: 36_000_000, 다: 24_000_000 },
  currentYearLimit: { 가: 300_000_000, 나: 150_000_000, 다: 75_000_000 },
  splitThreshold: 40_000_000,
};

const THRESHOLDS_BY_YEAR: Record<number, Thresholds> = {
  2023: thresholds2023,
  2024: thresholds2023,
  2025: thresholds2023,
};

export function getThresholds(taxYear: number): Thresholds {
  const t = THRESHOLDS_BY_YEAR[taxYear];
  if (!t)
    throw new Error(`${taxYear}년 귀속 단순경비율 기준 데이터가 없습니다`);
  return t;
}
