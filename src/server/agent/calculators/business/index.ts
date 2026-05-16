import { getExpenseRate } from "./expense-rates";
import { getThresholds } from "./thresholds";
import { getTaxBrackets } from "./tax-brackets";
import type { ExpenseMethod, TaxInput, TaxResult } from "./types";
import {
  BASIC_DEDUCTION_AMOUNT,
  LOCAL_INCOME_TAX_RATE,
  STANDARD_CAP_MULTIPLIER,
  STANDARD_TAX_CREDIT,
} from "./constants";

/**
 * 총칙 "나. 단순경비율에 의한 소득금액 계산방법"
 * 소득금액 = (수입금액 - 일자리안정자금) × (1 - 단순경비율)
 *
 * 인적용역(94****) 총칙 "다":
 * 소득금액 = {4천만까지 × (1 - 기본율)} + {초과분 × (1 - 초과율)}
 */
function calcSimpleIncome(
  income: number,
  stabilityFund: number,
  generalRate: number,
  excessRate: number,
  splitThreshold: number,
): number {
  const base = income - stabilityFund;

  // 비인적용역 (일반 업종)
  if (excessRate === 0) {
    return Math.floor(base * (1 - generalRate / 100));
  }

  if (base <= splitThreshold) {
    return Math.floor(base * (1 - generalRate / 100));
  }

  return Math.floor(
    splitThreshold * (1 - generalRate / 100) +
      (base - splitThreshold) * (1 - excessRate / 100),
  );
}

/**
 * 총칙 "가. 기준경비율에 의한 소득금액 계산방법"
 * 소득금액 = 수입금액 - 주요경비(매입비용 + 임차료 + 인건비) - (수입금액 × 기준경비율)
 */
function calcStandardIncome(
  income: number,
  standardRate: number,
  majorExpenses: TaxInput["majorExpenses"],
): number {
  const major = majorExpenses
    ? majorExpenses.purchases + majorExpenses.rent + majorExpenses.laborCost
    : 0;
  return Math.max(
    0,
    income - major - Math.floor(income * (standardRate / 100)),
  );
}

function resolveBusinessIncome(input: TaxInput): {
  method: ExpenseMethod;
  businessIncome: number;
} {
  const entry = getExpenseRate(input.taxYear, input.businessCode);
  const { prevYearLimit, currentYearLimit, splitThreshold } = getThresholds(
    input.taxYear,
  );
  const group = entry.incomeGroup;
  const stabilityFund = input.stabilityFund ?? 0;

  const canUseSimple =
    input.previousYearIncome < prevYearLimit[group] &&
    input.totalIncome < currentYearLimit[group];

  if (canUseSimple) {
    return {
      method: "simple",
      businessIncome: Math.max(
        0,
        calcSimpleIncome(
          input.totalIncome,
          stabilityFund,
          entry.simpleRateGeneral,
          entry.simpleRateExcess,
          splitThreshold,
        ),
      ),
    };
  }

  const standardIncome = calcStandardIncome(
    input.totalIncome,
    entry.standardRate,
    input.majorExpenses,
  );

  // 비교과세 상한: min(기준 소득금액, 단순경비율 소득금액 × 2.8)
  const simpleIncomeForCap = calcSimpleIncome(
    input.totalIncome,
    stabilityFund,
    entry.simpleRateGeneral,
    entry.simpleRateExcess,
    splitThreshold,
  );
  const cappedIncome = Math.min(
    standardIncome,
    Math.floor(simpleIncomeForCap * STANDARD_CAP_MULTIPLIER),
  );

  return { method: "standard", businessIncome: Math.max(0, cappedIncome) };
}

// 소득세법 제50조 기본공제: 본인 + 부양가족 1인당 150만원
function calcIncomeDeductions(input: TaxInput): number {
  const basic = (1 + input.dependents) * BASIC_DEDUCTION_AMOUNT;
  const { nationalPension = 0 } = input.incomeDeductions;
  return basic + nationalPension;
}

function calcTaxCredits(): number {
  /**
   * 소득세법 제59조의4⑨②나 — 표준세액공제 (사업소득자 기본)
   * 종합소득자(근로소득 없음) 중 성실사업자 외: 연 7만원
   *
   * 의료비·교육비(②③항)는 "근로소득이 있는 거주자"만 적용 — 사업소득자 해당 없음
   * 기부금(④항)은 "사업소득만 있는 자는 제외" — 사업소득자 원칙적 해당 없음
   */
  return STANDARD_TAX_CREDIT;
}

function applyTaxBracket(taxableIncome: number, taxYear: number) {
  const brackets = getTaxBrackets(taxYear);

  if (taxableIncome <= 0) {
    return {
      calculatedTax: 0,
      taxRate: brackets[0].rate,
      taxBracket: brackets[0].label,
    };
  }

  const bracket = brackets.find(
    (b) => b.limit === null || taxableIncome <= b.limit,
  );
  if (!bracket) throw new Error("세율 구간을 찾을 수 없습니다");

  return {
    calculatedTax: Math.max(
      0,
      Math.floor(taxableIncome * bracket.rate - bracket.progressiveDeduction),
    ),
    taxRate: bracket.rate,
    taxBracket: bracket.label,
  };
}

export function calculateBusinessTax(input: TaxInput): TaxResult {
  const grossIncome = input.totalIncome;
  const { method: expenseMethod, businessIncome } =
    resolveBusinessIncome(input);
  const expenses = grossIncome - businessIncome;
  const incomeDeductions = calcIncomeDeductions(input);
  const totalDeductions = Math.min(incomeDeductions, businessIncome);
  const taxableIncome = Math.max(0, businessIncome - totalDeductions);
  const { calculatedTax, taxRate, taxBracket } = applyTaxBracket(
    taxableIncome,
    input.taxYear,
  );
  const taxCredit = calcTaxCredits();
  const taxAfterCredit = Math.max(0, calculatedTax - taxCredit);
  const localIncomeTax = Math.floor(taxAfterCredit * LOCAL_INCOME_TAX_RATE);

  return {
    grossIncome,
    expenseMethod,
    expenses,
    businessIncome,
    totalDeductions,
    taxableIncome,
    taxRate,
    taxBracket,
    calculatedTax,
    taxCredit,
    localIncomeTax,
    finalTax: taxAfterCredit + localIncomeTax,
  };
}
