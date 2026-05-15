# 에이전트 워크플로우

## 타입 정의

```typescript
// src/types/index.ts

// 현재 지원: business, freelance
// 추가 예정: 'employment' | 'financial' | 'pension' | 'other'
export type IncomeType = "business" | "freelance";

// 공통 공제 항목 (소득 유형 무관)
export type CommonDeductions = {
  nationalPension?: number;
  healthInsurance?: number;
  medical?: number;
  education?: number;
  donation?: number;
};

// 소득 유형별 입력 (현재는 business/freelance 공통 구조)
// 새 소득 유형 추가 시 해당 필드만 추가
export type TaxInput = {
  incomeType: IncomeType;
  taxYear: number;
  dependents: number;
  deductions: CommonDeductions;

  // business / freelance
  totalIncome: number; // 총수입금액 (원 단위)
  expenses?: number; // 필요경비 (업종별 경비율 미적용 시 직접 입력)

  // 추가 예정 필드 예시 (현재 사용 안 함)
  // employment: { grossSalary: number; withheldTax: number }
  // financial: { interestIncome: number; dividendIncome: number }
};

export type TaxResult = {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxRate: number; // 0.24 = 24%
  taxBracket: string;
  calculatedTax: number;
  localIncomeTax: number; // calculatedTax * 0.1
  finalTax: number;
};

export type LawChunk = {
  article: string;
  content: string;
  similarity: number;
};
```

## Tools

```typescript
// src/agent/tools.ts

export const tools = {
  vector_search: {
    description: '종합소득세 관련 세법 조항을 검색한다.',
    parameters: z.object({
      query: z.string().describe('검색할 세법 내용 (예: "소득세법 세율 2024")'),
    }),
    execute: async ({ query }) => {
      const embedding = await getQueryEmbedding(query)
      return searchLawChunks(embedding)
    },
  },

  tax_calculator: {
    description: '세액을 결정적으로 계산한다. LLM이 직접 계산하지 말고 반드시 이 tool을 사용한다.',
    parameters: z.object({
      input: z.object({
        incomeType: z.enum(['freelance', 'business', 'rental', 'mixed']),
        totalIncome: z.number(),
        taxYear: z.number(),
        dependents: z.number(),
        deductions: z.object({ ... }).partial(),
      }),
    }),
    execute: async ({ input }) => {
      const result = calculateTax(input)
      const verification = verifyResult(result)
      if (!verification.passed) {
        // LLM이 오류를 받고 maxSteps 내에서 재호출
        return { error: verification.reasons }
      }
      return result
    },
  },
}
```

### tax_calculator 내부 구현

전략 패턴(Strategy Pattern)으로 소득 유형별 계산기를 분리한다.  
새 소득 유형 추가 시 `calculators/`에 파일 하나 추가하고 `CALCULATORS`에 등록하면 끝.

```typescript
// src/agent/calculators/index.ts

import { calculateBusinessTax } from "./business";
// 추가 예정: import { calculateEmploymentTax } from './employment'

const CALCULATORS: Record<IncomeType, (input: TaxInput) => TaxResult> = {
  business: calculateBusinessTax,
  freelance: calculateBusinessTax, // 사업소득과 동일 산식
  // employment: calculateEmploymentTax,
  // financial:  calculateFinancialTax,
};

export function calculateTax(input: TaxInput): TaxResult {
  const calculator = CALCULATORS[input.incomeType];
  return calculator(input);
}
```

```typescript
// src/agent/calculators/business.ts  ← 현재 구현 파일

const TAX_BRACKETS = [
  { min: 0,            max: 14_000_000,   rate: 0.06, deduction: 0 },
  { min: 14_000_000,   max: 50_000_000,   rate: 0.15, deduction: 1_260_000 },
  { min: 50_000_000,   max: 88_000_000,   rate: 0.24, deduction: 5_760_000 },
  { min: 88_000_000,   max: 150_000_000,  rate: 0.35, deduction: 15_440_000 },
  { min: 150_000_000,  max: 300_000_000,  rate: 0.38, deduction: 19_940_000 },
  { min: 300_000_000,  max: 500_000_000,  rate: 0.40, deduction: 25_940_000 },
  { min: 500_000_000,  max: 1_000_000_000,rate: 0.42, deduction: 35_940_000 },
  { min: 1_000_000_000,max: Infinity,     rate: 0.45, deduction: 65_940_000 },
]

export function calculateBusinessTax(input: TaxInput): TaxResult { ... }
```

## 채팅 Route Handler

`streamText` + tools로 구현. 별도 에이전트 실행 함수 없이 Route Handler가 직접 조율한다.

```typescript
// src/app/api/chat/route.ts

export async function POST(req: Request) {
  const { messages, sessionId } = await req.json();
  const trace = langfuse.trace({ name: "chat", sessionId });

  // user 메시지 저장
  const userMessage = messages.at(-1);
  await saveMessage(sessionId, { role: "user", content: userMessage.content });

  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system: buildSystemPrompt(),
    messages,
    tools, // tax_calculator.execute 내부에서 verifyResult 호출
    maxSteps: 10,
    onFinish: async ({ text, toolCalls }) => {
      await saveMessage(sessionId, {
        role: "assistant",
        content: text,
        toolCalls,
      });
      trace.update({ output: { text } });
    },
  });

  return result.toDataStreamResponse();
}
```

## 검증 로직

```typescript
// src/agent/verify.ts

type VerifyResult = { passed: boolean; reasons: string[] };

export function verifyResult(result: TaxResult | null): VerifyResult {
  if (!result) return { passed: false, reasons: ["계산 결과 없음"] };

  const reasons: string[] = [];

  // 1. 수식 검증: taxableIncome = grossIncome - totalDeductions
  if (result.taxableIncome !== result.grossIncome - result.totalDeductions) {
    reasons.push("과세표준 계산 오류");
  }

  // 2. 세율 적용 검증: calculatedTax = taxableIncome * rate - deduction
  const bracket = findBracket(result.taxableIncome);
  const expected = Math.floor(
    result.taxableIncome * bracket.rate - bracket.deduction,
  );
  if (Math.abs(result.calculatedTax - expected) > 1) {
    reasons.push("세율 적용 오류");
  }

  // 3. 지방소득세 검증: localIncomeTax = calculatedTax * 0.1
  if (Math.abs(result.localIncomeTax - result.calculatedTax * 0.1) > 1) {
    reasons.push("지방소득세 계산 오류");
  }

  return { passed: reasons.length === 0, reasons };
}
```

## 시스템 프롬프트 방향

- 세무사 페르소나
- `tax_calculator` tool을 반드시 사용하여 계산 (직접 계산 금지 명시)
- `vector_search`로 세법 근거 확보 후 계산
- 계산 완료 후 결과를 사용자 친화적으로 설명
