import type { TaxInput, TaxResult } from "./business/types";
import { calculateBusinessTax } from "./business";

export type { TaxInput, TaxResult };

export function calculate(input: TaxInput): TaxResult {
  switch (input.incomeType) {
    case "business":
    case "freelance":
      // 둘 다 사업소득으로 동일 산식 적용
      return calculateBusinessTax(input);
    default: {
      const exhaustive: never = input.incomeType;
      throw new Error(`지원하지 않는 소득 유형입니다: ${exhaustive}`);
    }
  }
}
