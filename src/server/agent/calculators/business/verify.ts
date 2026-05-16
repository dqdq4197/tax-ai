import type { TaxInput, TaxResult } from "./types";
import {
  LOCAL_INCOME_TAX_RATE,
  MAX_TAX_RATE,
  MIN_TAX_RATE,
  STANDARD_TAX_CREDIT,
} from "./constants";

const NON_NEGATIVE_FIELDS = [
  "grossIncome",
  "expenses",
  "businessIncome",
  "totalDeductions",
  "taxableIncome",
  "calculatedTax",
  "taxCredit",
  "localIncomeTax",
  "finalTax",
] as const satisfies ReadonlyArray<keyof TaxResult>;

export function verifyResult(input: TaxInput, result: TaxResult): void {
  for (const field of NON_NEGATIVE_FIELDS) {
    if (result[field] < 0) {
      throw new Error(`검증 실패: ${field}가 음수입니다 (${result[field]})`);
    }
  }

  if (result.grossIncome !== input.totalIncome) {
    throw new Error(
      `검증 실패: grossIncome(${result.grossIncome}) ≠ input.totalIncome(${input.totalIncome})`,
    );
  }

  if (result.expenses !== result.grossIncome - result.businessIncome) {
    throw new Error(
      `검증 실패: expenses(${result.expenses}) ≠ grossIncome - businessIncome`,
    );
  }

  if (result.taxRate < MIN_TAX_RATE || result.taxRate > MAX_TAX_RATE) {
    throw new Error(
      `검증 실패: taxRate(${result.taxRate})가 법정 범위(6%~45%) 밖입니다`,
    );
  }

  if (result.taxCredit !== STANDARD_TAX_CREDIT) {
    throw new Error(
      `검증 실패: taxCredit(${result.taxCredit}) ≠ ${STANDARD_TAX_CREDIT}`,
    );
  }

  const taxAfterCredit = Math.max(0, result.calculatedTax - result.taxCredit);

  const expectedLocalTax = Math.floor(taxAfterCredit * LOCAL_INCOME_TAX_RATE);
  if (result.localIncomeTax !== expectedLocalTax) {
    throw new Error(
      `검증 실패: localIncomeTax(${result.localIncomeTax}) ≠ 기대값(${expectedLocalTax})`,
    );
  }

  const expectedFinalTax = taxAfterCredit + result.localIncomeTax;
  if (result.finalTax !== expectedFinalTax) {
    throw new Error(
      `검증 실패: finalTax(${result.finalTax}) ≠ 기대값(${expectedFinalTax})`,
    );
  }
}
