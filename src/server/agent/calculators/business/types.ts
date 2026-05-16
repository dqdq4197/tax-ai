import type { IncomeDeductions } from "../../types";

/** 소득세법 시행령 제143조④ — 단순/기준경비율 기준금액 구분 기준 */
export type IncomeGroup = "가" | "나" | "다";

/** 소득세법 시행령 제143조 — 기준경비율 방식에서 증빙이 필요한 주요경비 */
export type MajorExpenses = {
  /** 매입비용 (재화 매입·외주 등) */
  purchases: number;
  /** 임차료 */
  rent: number;
  /** 인건비 */
  laborCost: number;
};

/** 단순: 업종코드별 경비율 일괄 적용 / 기준: 주요경비 + 기준경비율 */
export type ExpenseMethod = "simple" | "standard";

export type TaxInput = {
  /** 둘 다 사업소득으로 동일 산식 적용 */
  incomeType: "business" | "freelance";
  taxYear: number;
  /** 국세청 업종코드 (예: "940926") */
  businessCode: string;
  /** 당해연도 총수입금액 */
  totalIncome: number;
  /** 직전연도 수입금액 — 단순/기준경비율 방식 판단 기준 (소득세법 시행령 제143조) */
  previousYearIncome: number;
  /** 부양가족 수 (본인 제외) */
  dependents: number;
  /** 소득공제 항목 (소득세법 제51조의3) */
  incomeDeductions: IncomeDeductions;
  /** 기준경비율 방식일 때만 필요 */
  majorExpenses?: MajorExpenses;
  /** 일자리안정자금 — 단순경비율 소득금액 산식의 차감 항목 (고시 총칙 "나") */
  stabilityFund?: number;
};

export type TaxResult = {
  /** 총수입금액 */
  grossIncome: number;
  expenseMethod: ExpenseMethod;
  /** 인정된 필요경비 합계 */
  expenses: number;
  /** 사업소득금액 = 총수입금액 - 필요경비 */
  businessIncome: number;
  /** 소득공제 합계 (사업소득금액 초과분 제외) */
  totalDeductions: number;
  /** 과세표준 = 사업소득금액 - 소득공제 */
  taxableIncome: number;
  taxRate: number;
  taxBracket: string;
  /** 산출세액 = 과세표준 × 세율 - 누진공제 */
  calculatedTax: number;
  /** 표준세액공제 — 소득세법 제59조의4⑨②나 (사업소득자: 연 7만원) */
  taxCredit: number;
  /** 지방소득세 = (산출세액 - 세액공제) × 10% — 지방세법 제92조 */
  localIncomeTax: number;
  /** 최종 납부세액 = 산출세액 - 세액공제 + 지방소득세 */
  finalTax: number;
};
