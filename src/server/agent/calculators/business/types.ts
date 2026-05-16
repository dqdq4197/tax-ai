import type { IncomeDeductions, TaxCreditInputs } from "../../types";

// 소득세법 시행령 제143조④ — 업종 그룹 분류 (단순/기준경비율 기준금액 구분 기준)
export type IncomeGroup = "가" | "나" | "다";

// 기준경비율 방식 적용 시 실제 지출 증빙이 필요한 주요경비 항목 (소득세법 시행령 제143조)
export type MajorExpenses = {
  purchases: number;  // 매입비용 (재화 매입·외주 등)
  rent: number;       // 임차료
  laborCost: number;  // 인건비
};

// 단순: 업종코드별 경비율 일괄 적용 / 기준: 주요경비 + 기준경비율 / 실제: 장부 기반 (미구현)
export type ExpenseMethod = "simple" | "standard" | "actual";

export type TaxInput = {
  incomeType: "business" | "freelance"; // 둘 다 사업소득으로 동일 산식 적용
  taxYear: number;
  businessCode: string;          // 국세청 업종코드 (예: "940926")
  totalIncome: number;           // 당해연도 총수입금액
  previousYearIncome: number;    // 직전연도 수입금액 — 단순/기준경비율 방식 판단 기준 (제143조)
  dependents: number;            // 부양가족 수 (본인 제외)
  incomeDeductions: IncomeDeductions;   // 소득공제 — 과세표준 산정 전 차감 (소득세법 제51조의3)
  taxCreditInputs?: TaxCreditInputs;    // 세액공제 — 산출세액에서 직접 차감 (소득세법 제59조의4)
  majorExpenses?: MajorExpenses; // 기준경비율 방식일 때만 필요
  /** 일자리안정자금 — 단순경비율 소득금액 산식의 차감 항목 (총칙 "나") */
  stabilityFund?: number;
};

export type TaxResult = {
  grossIncome: number;       // 총수입금액
  expenseMethod: ExpenseMethod;
  expenses: number;          // 인정된 필요경비 합계
  businessIncome: number;    // 사업소득금액 = 총수입금액 - 필요경비
  totalDeductions: number;   // 소득공제 합계 (사업소득금액 초과분 제외)
  taxableIncome: number;     // 과세표준 = 사업소득금액 - 소득공제
  taxRate: number;
  taxBracket: string;
  calculatedTax: number;     // 산출세액 = 과세표준 × 세율 - 누진공제
  taxCredit: number;         // 세액공제 합계 (소득세법 제59조의4) — TODO: 공제율 확인 전 0
  localIncomeTax: number;    // 지방소득세 = (산출세액 - 세액공제) × 10% (지방세법 제92조)
  finalTax: number;          // 최종 납부세액 = 산출세액 - 세액공제 + 지방소득세
};
