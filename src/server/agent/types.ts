export type IncomeType = "business" | "freelance";

/** 소득공제 항목 — 과세표준 산정 전 소득에서 차감 */
export type IncomeDeductions = {
  /** 소득세법 제51조의3 — 납입한 공적연금 보험료 전액 공제 */
  nationalPension?: number;
};

export type LawChunk = {
  article: string;
  content: string;
  similarity: number;
};
