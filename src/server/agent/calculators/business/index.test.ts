import { describe, expect, it } from "vitest";
import { calculateBusinessTax } from "./index";
import type { TaxInput } from "./types";

// 2024년 실제 업종코드 기준
// 551003: 청소년 수련시설 운영업, 다 그룹, simpleGeneral=87.8, standard=29.9
// 940926: 소프트웨어프리랜서,   나 그룹, simpleGeneral=64.1, simpleExcess=49.7, standard=20.9
//
// 2024 thresholds:
//   prevYearLimit  — 가:6천만, 나:3천6백만, 다:2천4백만
//   currentYearLimit — 가:3억, 나:1억5천만, 다:7천5백만
//   splitThreshold — 4천만원

const BASE_INPUT: TaxInput = {
  incomeType: "business",
  taxYear: 2024,
  businessCode: "551003",
  totalIncome: 30_000_000,
  previousYearIncome: 15_000_000,
  dependents: 0,
  incomeDeductions: {},
};

describe("단순경비율 (simple) — 일반 업종", () => {
  it("단순경비율 방식이 선택된다 (직전·당해 수입 모두 기준 미만)", () => {
    // 551003 다 그룹: prevYearLimit=2,400만, currentYearLimit=7,500만
    // 직전 15M < 2,400만 ✓, 당해 30M < 7,500만 ✓
    const result = calculateBusinessTax(BASE_INPUT);
    expect(result.expenseMethod).toBe("simple");
  });

  it("사업소득금액 = floor(수입금액 × (1 - 단순경비율))", () => {
    // floor(30,000,000 × (1 - 0.878)) = floor(3,660,000) = 3,660,000
    const result = calculateBusinessTax(BASE_INPUT);
    expect(result.businessIncome).toBe(3_660_000);
    expect(result.expenses).toBe(30_000_000 - 3_660_000);
  });

  it("과세표준 = 사업소득금액 - 소득공제(기본공제)", () => {
    // 기본공제 1,500,000 / 사업소득 3,660,000 → 과세표준 2,160,000
    const result = calculateBusinessTax(BASE_INPUT);
    expect(result.totalDeductions).toBe(1_500_000);
    expect(result.taxableIncome).toBe(2_160_000);
  });

  it("세율 6% 구간 산출세액·지방소득세·최종세액이 정확하다", () => {
    // calculatedTax = floor(2,160,000 × 0.06) = 129,600
    // taxCredit = 70,000 → taxAfterCredit = 59,600
    // localIncomeTax = floor(59,600 × 0.1) = 5,960
    // finalTax = 65,560
    const result = calculateBusinessTax(BASE_INPUT);
    expect(result.calculatedTax).toBe(129_600);
    expect(result.taxCredit).toBe(70_000);
    expect(result.localIncomeTax).toBe(5_960);
    expect(result.finalTax).toBe(65_560);
  });
});

describe("인적용역(94****) 4천만원 기본율·초과율 분기", () => {
  const personalInput: TaxInput = {
    ...BASE_INPUT,
    businessCode: "940926", // 소프트웨어프리랜서, 나 그룹
    previousYearIncome: 20_000_000,
  };

  it("4천만원 이하: 기본율(64.1%)만 적용", () => {
    // base=30M ≤ 4,000만 → floor(30M × 0.359) = 10,770,000
    const result = calculateBusinessTax({
      ...personalInput,
      totalIncome: 30_000_000,
    });
    expect(result.expenseMethod).toBe("simple");
    expect(result.businessIncome).toBe(10_770_000);
  });

  it("4천만원 초과: 4천만까지 기본율 + 초과분에 초과율(49.7%) 적용", () => {
    // floor(40M × 0.359 + 20M × 0.503) = floor(14,360,000 + 10,060,000) = 24,420,000
    const result = calculateBusinessTax({
      ...personalInput,
      totalIncome: 60_000_000,
    });
    expect(result.businessIncome).toBe(24_420_000);
  });

  it("4천만원 초과 시 세액 계산이 정확하다", () => {
    // taxableIncome = 24,420,000 - 1,500,000 = 22,920,000 (15% 구간)
    // calculatedTax = floor(22,920,000 × 0.15 - 1,260,000) = 2,178,000
    // taxAfterCredit = 2,108,000, localIncomeTax = 210,800, finalTax = 2,318,800
    const result = calculateBusinessTax({
      ...personalInput,
      totalIncome: 60_000_000,
    });
    expect(result.taxableIncome).toBe(22_920_000);
    expect(result.calculatedTax).toBe(2_178_000);
    expect(result.localIncomeTax).toBe(210_800);
    expect(result.finalTax).toBe(2_318_800);
  });
});

describe("기준경비율 (standard)", () => {
  it("직전연도 수입 기준 초과 시 기준경비율 방식이 선택된다", () => {
    // 940926 나 그룹: prevYearLimit=3,600만 → 4천만 >= 3,600만 → canUseSimple=false
    const result = calculateBusinessTax({
      ...BASE_INPUT,
      businessCode: "940926",
      totalIncome: 80_000_000,
      previousYearIncome: 40_000_000,
      majorExpenses: {
        purchases: 5_000_000,
        rent: 3_000_000,
        laborCost: 2_000_000,
      },
    });
    expect(result.expenseMethod).toBe("standard");
  });

  it("사업소득금액 = 수입금액 - 주요경비 - (수입금액 × 기준경비율)", () => {
    // 80M - 10M - floor(80M × 0.209) = 80M - 10M - 16,720,000 = 53,280,000
    const result = calculateBusinessTax({
      ...BASE_INPUT,
      businessCode: "940926",
      totalIncome: 80_000_000,
      previousYearIncome: 40_000_000,
      majorExpenses: {
        purchases: 5_000_000,
        rent: 3_000_000,
        laborCost: 2_000_000,
      },
    });
    expect(result.businessIncome).toBe(53_280_000);
  });

  it("최종 세액이 정확하다", () => {
    // taxableIncome = 51,780,000 (24% 구간)
    // calculatedTax = floor(51,780,000 × 0.24 - 5,760,000) = 6,667,200
    // taxAfterCredit = 6,597,200, localIncomeTax = 659,720, finalTax = 7,256,920
    const result = calculateBusinessTax({
      ...BASE_INPUT,
      businessCode: "940926",
      totalIncome: 80_000_000,
      previousYearIncome: 40_000_000,
      majorExpenses: {
        purchases: 5_000_000,
        rent: 3_000_000,
        laborCost: 2_000_000,
      },
    });
    expect(result.calculatedTax).toBe(6_667_200);
    expect(result.localIncomeTax).toBe(659_720);
    expect(result.finalTax).toBe(7_256_920);
  });
});

describe("비교과세 2.8배 상한", () => {
  // 551003 다 그룹: prevYearLimit=2,400만 → 직전 3천만이면 canUseSimple=false
  // 주요경비 없음 → standardIncome 높음, simpleIncome 낮음 → 상한 초과 케이스
  const capInput: TaxInput = {
    ...BASE_INPUT,
    businessCode: "551003",
    totalIncome: 50_000_000,
    previousYearIncome: 30_000_000,
    majorExpenses: { purchases: 0, rent: 0, laborCost: 0 },
  };

  it("기준경비율 소득금액이 단순경비율 소득금액 × 2.8을 초과하면 상한으로 제한된다", () => {
    // simpleIncome = floor(50M × 0.122) = 6,100,000
    // cap = floor(6,100,000 × 2.8) = 17,080,000
    // standardIncome = 50M - floor(50M × 0.299) = 35,050,000 > 17,080,000 → cap 적용
    const result = calculateBusinessTax(capInput);
    expect(result.expenseMethod).toBe("standard");
    expect(result.businessIncome).toBe(17_080_000);
  });

  it("2.8배 상한 적용 후 세액이 정확하다", () => {
    // taxableIncome = 17,080,000 - 1,500,000 = 15,580,000 (15% 구간)
    // calculatedTax = floor(15,580,000 × 0.15 - 1,260,000) = 1,077,000
    // taxAfterCredit = 1,007,000, localIncomeTax = 100,700, finalTax = 1,107,700
    const result = calculateBusinessTax(capInput);
    expect(result.taxableIncome).toBe(15_580_000);
    expect(result.calculatedTax).toBe(1_077_000);
    expect(result.finalTax).toBe(1_107_700);
  });
});

describe("표준세액공제 및 지방소득세", () => {
  it("표준세액공제는 항상 7만원이다", () => {
    const result = calculateBusinessTax(BASE_INPUT);
    expect(result.taxCredit).toBe(70_000);
  });

  it("지방소득세 = floor((산출세액 - 세액공제) × 10%)", () => {
    const result = calculateBusinessTax(BASE_INPUT);
    const taxAfterCredit = Math.max(0, result.calculatedTax - result.taxCredit);
    expect(result.localIncomeTax).toBe(Math.floor(taxAfterCredit * 0.1));
  });

  it("finalTax = (산출세액 - 세액공제) + 지방소득세", () => {
    const result = calculateBusinessTax(BASE_INPUT);
    expect(result.finalTax).toBe(
      result.calculatedTax - result.taxCredit + result.localIncomeTax,
    );
  });
});

describe("과세표준 0 이하 처리", () => {
  it("소득공제가 사업소득금액을 초과해도 과세표준은 0으로 처리된다", () => {
    // businessIncome = floor(5M × 0.122) = 610,000 < 기본공제 1,500,000
    // totalDeductions = min(1,500,000, 610,000) = 610,000
    // taxableIncome = 0, finalTax = 0
    const result = calculateBusinessTax({
      ...BASE_INPUT,
      totalIncome: 5_000_000,
    });
    expect(result.taxableIncome).toBe(0);
    expect(result.calculatedTax).toBe(0);
    expect(result.finalTax).toBe(0);
    expect(result.totalDeductions).toBe(result.businessIncome);
  });
});

describe("소득공제 — 국민연금 (제51조의3)", () => {
  it("nationalPension만큼 과세표준이 감소한다", () => {
    const without = calculateBusinessTax(BASE_INPUT);
    const with_ = calculateBusinessTax({
      ...BASE_INPUT,
      incomeDeductions: { nationalPension: 2_000_000 },
    });
    expect(with_.taxableIncome).toBe(without.taxableIncome - 2_000_000);
  });
});

describe("일자리안정자금 (stabilityFund)", () => {
  it("단순경비율 방식에서 stabilityFund만큼 기준금액이 줄어 소득금액이 감소한다", () => {
    const without = calculateBusinessTax(BASE_INPUT);
    const with_ = calculateBusinessTax({
      ...BASE_INPUT,
      stabilityFund: 1_000_000,
    });
    // base = 수입금액 - stabilityFund → base 감소 → businessIncome 감소
    expect(with_.businessIncome).toBeLessThan(without.businessIncome);
  });
});

describe("지원하지 않는 연도", () => {
  it("미지원 연도 입력 시 에러가 발생한다", () => {
    expect(() =>
      calculateBusinessTax({ ...BASE_INPUT, taxYear: 2022 }),
    ).toThrow();
  });
});

describe("부양가족 공제", () => {
  it("부양가족 1인당 기본공제 150만원이 추가 적용된다", () => {
    // 551003 다 그룹: totalIncome=50M → businessIncome=floor(50M×0.122)=6,100,000
    // dependents=0: incomeDeductions=1,500,000 < 6,100,000 → totalDeductions=1,500,000
    // dependents=2: incomeDeductions=4,500,000 < 6,100,000 → totalDeductions=4,500,000 → 차이=3,000,000
    const input = { ...BASE_INPUT, totalIncome: 50_000_000 };
    const without = calculateBusinessTax(input);
    const with2 = calculateBusinessTax({ ...input, dependents: 2 });
    expect(with2.totalDeductions - without.totalDeductions).toBe(3_000_000);
  });
});

// ── edge cases ───────────────────────────────────────────────────────────────

describe("산출세액 < 세액공제 (7만원 미만)", () => {
  it("taxAfterCredit·localIncomeTax·finalTax 모두 0이 된다", () => {
    // 551003 다 그룹: businessIncome=floor(20M×0.122)=2,440,000
    // taxableIncome=940,000 → calculatedTax=floor(940,000×0.06)=56,400 < 70,000
    const result = calculateBusinessTax({
      ...BASE_INPUT,
      totalIncome: 20_000_000,
    });
    expect(result.calculatedTax).toBe(56_400);
    expect(result.localIncomeTax).toBe(0);
    expect(result.finalTax).toBe(0);
  });
});

describe("당해연도 수입 기준(currentYearLimit) 초과 → 기준경비율 강제", () => {
  it("직전연도가 기준 미만이라도 당해연도가 기준 이상이면 기준경비율이 선택된다", () => {
    // 551003 다 그룹: currentYearLimit=7,500만 → 8천만 ≥ 7,500만 → standard 강제
    // 직전 1천만 < prevYearLimit(2,400만)이지만 무관
    const result = calculateBusinessTax({
      ...BASE_INPUT,
      totalIncome: 80_000_000,
      previousYearIncome: 10_000_000,
      majorExpenses: { purchases: 0, rent: 0, laborCost: 0 },
    });
    expect(result.expenseMethod).toBe("standard");
  });

  it("2.8배 상한 적용 후 세액이 정확하다", () => {
    // standardIncome=80M-floor(80M×0.299)=56,080,000
    // simpleForCap=floor(80M×0.122)=9,760,000 → cap=floor(9,760,000×2.8)=27,328,000
    // businessIncome=27,328,000 (cap 적용), taxableIncome=25,828,000 (15% 구간)
    // calculatedTax=floor(25,828,000×0.15-1,260,000)=2,614,200
    // localIncomeTax=floor(2,544,200×0.1)=254,420, finalTax=2,798,620
    const result = calculateBusinessTax({
      ...BASE_INPUT,
      totalIncome: 80_000_000,
      previousYearIncome: 10_000_000,
      majorExpenses: { purchases: 0, rent: 0, laborCost: 0 },
    });
    expect(result.businessIncome).toBe(27_328_000);
    expect(result.taxableIncome).toBe(25_828_000);
    expect(result.calculatedTax).toBe(2_614_200);
    expect(result.localIncomeTax).toBe(254_420);
    expect(result.finalTax).toBe(2_798_620);
  });
});

describe("가 그룹 업종 (011001 — 채소작물 재배업, simpleGeneral=93.5%)", () => {
  // 가 그룹 prevYearLimit=6천만, currentYearLimit=3억
  const gaInput = {
    ...BASE_INPUT,
    businessCode: "011001",
    totalIncome: 50_000_000,
    previousYearIncome: 30_000_000,
  };

  it("단순경비율 방식이 선택된다 (직전 3천만 < 6천만, 당해 5천만 < 3억)", () => {
    expect(calculateBusinessTax(gaInput).expenseMethod).toBe("simple");
  });

  it("세액이 정확하다 (소수점 손실 포함)", () => {
    // businessIncome=floor(50M×(1-0.935))=3,249,999 (float 손실)
    // taxableIncome=1,749,999, calculatedTax=104,999
    // taxAfterCredit=34,999, localIncomeTax=3,499, finalTax=38,498
    const result = calculateBusinessTax(gaInput);
    expect(result.businessIncome).toBe(3_249_999);
    expect(result.taxableIncome).toBe(1_749_999);
    expect(result.calculatedTax).toBe(104_999);
    expect(result.localIncomeTax).toBe(3_499);
    expect(result.finalTax).toBe(38_498);
  });
});

describe("세율 구간 — 고소득 (940926, 기준경비율, 주요경비 없음)", () => {
  const highIncomeBase = {
    ...BASE_INPUT,
    businessCode: "940926",
    incomeDeductions: {},
    majorExpenses: {
      purchases: 0 as const,
      rent: 0 as const,
      laborCost: 0 as const,
    },
  };

  it("35% 구간 (과세표준 1.17억): taxRate=0.35, finalTax=28,041,750", () => {
    // income=1.5억, prevYear=5천만 → standard (prevYear 3,600만 초과)
    // businessIncome=118,650,000, taxableIncome=117,150,000
    // calculatedTax=floor(117,150,000×0.35-15,440,000)=25,562,500
    const result = calculateBusinessTax({
      ...highIncomeBase,
      totalIncome: 150_000_000,
      previousYearIncome: 50_000_000,
    });
    expect(result.taxRate).toBe(0.35);
    expect(result.calculatedTax).toBe(25_562_500);
    expect(result.finalTax).toBe(28_041_750);
  });

  it("40% 구간 (과세표준 3.15억): taxRate=0.40, finalTax=109,945,000", () => {
    // income=4억, prevYear=8천만 → standard
    // businessIncome=316,400,000, taxableIncome=314,900,000
    // calculatedTax=floor(314,900,000×0.40-25,940,000)=100,020,000
    const result = calculateBusinessTax({
      ...highIncomeBase,
      totalIncome: 400_000_000,
      previousYearIncome: 80_000_000,
    });
    expect(result.taxRate).toBe(0.4);
    expect(result.calculatedTax).toBe(100_020_000);
    expect(result.finalTax).toBe(109_945_000);
  });

  it("45% 구간 (과세표준 15.8억): taxRate=0.45, finalTax=709,736,500", () => {
    // income=20억, prevYear=3억 → standard
    // businessIncome=1,582,000,000, taxableIncome=1,580,500,000
    // calculatedTax=floor(1,580,500,000×0.45-65,940,000)=645,285,000
    const result = calculateBusinessTax({
      ...highIncomeBase,
      totalIncome: 2_000_000_000,
      previousYearIncome: 300_000_000,
    });
    expect(result.taxRate).toBe(0.45);
    expect(result.calculatedTax).toBe(645_285_000);
    expect(result.finalTax).toBe(709_736_500);
  });
});

describe("2025년 귀속 — 경비율 데이터 갱신 반영", () => {
  it("940926 simpleRateGeneral 64.1→64.4, Excess 49.7→50.2 변경이 반영된다", () => {
    // 2024: businessIncome=floor(40M×0.359+20M×0.503)=24,420,000
    // 2025: businessIncome=floor(40M×0.356+20M×0.498)=24,200,000
    const r2024 = calculateBusinessTax({
      ...BASE_INPUT,
      businessCode: "940926",
      totalIncome: 60_000_000,
      previousYearIncome: 20_000_000,
    });
    const r2025 = calculateBusinessTax({
      ...BASE_INPUT,
      businessCode: "940926",
      taxYear: 2025,
      totalIncome: 60_000_000,
      previousYearIncome: 20_000_000,
    });
    expect(r2024.businessIncome).toBe(24_420_000);
    expect(r2025.businessIncome).toBe(24_200_000);
    expect(r2025.finalTax).toBe(2_282_500);
  });
});
