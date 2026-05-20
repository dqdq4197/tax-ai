import { describe, expect, it } from "vitest";
import { verifyResult } from "./verify";
import type { TaxInput, TaxResult } from "./types";

// 기준값: 940926, 2024, 6천만 수입 (인적용역 4천만 초과 단순경비율 케이스)
const VALID_INPUT: TaxInput = {
  incomeType: "business",
  taxYear: 2024,
  businessCode: "940926",
  totalIncome: 60_000_000,
  previousYearIncome: 20_000_000,
  dependents: 0,
  incomeDeductions: {},
};

const VALID_RESULT: TaxResult = {
  grossIncome: 60_000_000,
  expenseMethod: "simple",
  expenses: 35_580_000,
  businessIncome: 24_420_000,
  totalDeductions: 1_500_000,
  taxableIncome: 22_920_000,
  taxRate: 0.15,
  taxBracket: "1,400만원 초과 ~ 5,000만원 이하 (15%)",
  calculatedTax: 2_178_000,
  taxCredit: 70_000,
  localIncomeTax: 210_800,
  finalTax: 2_318_800,
};

describe("verifyResult — 정상 케이스", () => {
  it("유효한 결과는 오류를 던지지 않는다", () => {
    expect(() => verifyResult(VALID_INPUT, VALID_RESULT)).not.toThrow();
  });
});

describe("verifyResult — 음수 필드", () => {
  it("businessIncome이 음수이면 오류를 던진다", () => {
    expect(() =>
      verifyResult(VALID_INPUT, { ...VALID_RESULT, businessIncome: -1, expenses: 60_000_001 }),
    ).toThrow(/음수/);
  });

  it("finalTax가 음수이면 오류를 던진다", () => {
    expect(() =>
      verifyResult(VALID_INPUT, { ...VALID_RESULT, finalTax: -100 }),
    ).toThrow(/음수/);
  });
});

describe("verifyResult — grossIncome 불일치", () => {
  it("grossIncome ≠ input.totalIncome이면 오류를 던진다", () => {
    expect(() =>
      verifyResult(VALID_INPUT, { ...VALID_RESULT, grossIncome: 59_999_999 }),
    ).toThrow(/grossIncome/);
  });
});

describe("verifyResult — expenses 불일치", () => {
  it("expenses ≠ grossIncome - businessIncome이면 오류를 던진다", () => {
    expect(() =>
      verifyResult(VALID_INPUT, { ...VALID_RESULT, expenses: 1 }),
    ).toThrow(/expenses/);
  });
});

describe("verifyResult — 세율 범위", () => {
  it("taxRate가 6% 미만이면 오류를 던진다", () => {
    expect(() =>
      verifyResult(VALID_INPUT, { ...VALID_RESULT, taxRate: 0.05 }),
    ).toThrow(/taxRate/);
  });

  it("taxRate가 45% 초과이면 오류를 던진다", () => {
    expect(() =>
      verifyResult(VALID_INPUT, { ...VALID_RESULT, taxRate: 0.46 }),
    ).toThrow(/taxRate/);
  });
});

describe("verifyResult — 세액공제 불일치", () => {
  it("taxCredit이 7만원이 아니면 오류를 던진다", () => {
    expect(() =>
      verifyResult(VALID_INPUT, { ...VALID_RESULT, taxCredit: 80_000 }),
    ).toThrow(/taxCredit/);
  });
});

describe("verifyResult — 지방소득세 불일치", () => {
  it("localIncomeTax가 (산출세액-세액공제)×10%와 다르면 오류를 던진다", () => {
    expect(() =>
      verifyResult(VALID_INPUT, { ...VALID_RESULT, localIncomeTax: 999 }),
    ).toThrow(/localIncomeTax/);
  });
});

describe("verifyResult — finalTax 불일치", () => {
  it("finalTax가 taxAfterCredit + localIncomeTax와 다르면 오류를 던진다", () => {
    expect(() =>
      verifyResult(VALID_INPUT, { ...VALID_RESULT, finalTax: 0 }),
    ).toThrow(/finalTax/);
  });
});
