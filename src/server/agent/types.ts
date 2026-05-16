export type IncomeType = "business" | "freelance";

// TODO: 소득세법 제51조의3 원문 확인 필요
/** 소득공제 항목 — 과세표준 산정 전 소득에서 차감 */
export type IncomeDeductions = {
  /** 국민연금 보험료 */
  nationalPension?: number;
  /** 건강보험료 */
  healthInsurance?: number;
};

// TODO: 소득세법 제59조의4 원문 확인 필요 (공제율, 한도액)
/** 세액공제 항목 — 산출세액에서 직접 차감 */
export type TaxCreditInputs = {
  /** 의료비 — 종합소득금액 × 3% 초과분 × 공제율 */
  medical?: number;
  /** 교육비 — 지출액 × 공제율 */
  education?: number;
  /** 기부금 — 유형(법정/지정/종교단체)별 한도 및 공제율 상이 */
  donation?: number;
};

export type LawChunk = {
  article: string;
  content: string;
  similarity: number;
};
