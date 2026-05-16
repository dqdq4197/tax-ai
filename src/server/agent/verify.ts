import { calculate } from "./calculators";
import type { TaxInput, TaxResult } from "./calculators";

export function verifyResult(input: TaxInput, result: TaxResult): void {
  const expected = calculate(input);

  if (expected.taxableIncome !== result.taxableIncome) {
    throw new Error(
      `과세표준 검증 실패: 기대 ${expected.taxableIncome.toLocaleString()}원, 실제 ${result.taxableIncome.toLocaleString()}원`,
    );
  }

  if (expected.finalTax !== result.finalTax) {
    throw new Error(
      `세액 검증 실패: 기대 ${expected.finalTax.toLocaleString()}원, 실제 ${result.finalTax.toLocaleString()}원`,
    );
  }
}
