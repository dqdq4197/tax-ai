type Role = "user" | "assistant";

export type EvalCase = {
  id: string;
  description: string;
  messages: Array<{ role: Role; content: string }>;
  expect: {
    toolCalled?: "tax_calculator" | "vector_search" | "law_article_lookup";
    toolNotCalled?: "tax_calculator";
  };
};

export const GOLDEN_DATASET: EvalCase[] = [
  {
    id: "calc_freelance_simple",
    description:
      "프리랜서 단순경비율 케이스 — 업종코드 확인 후 tax_calculator 호출",
    messages: [
      {
        role: "user",
        content: "소프트웨어 개발 프리랜서야. 2024년 세금 계산하고 싶어.",
      },
      { role: "assistant", content: "네! 올해 총 수입이 얼마예요?" },
      {
        role: "user",
        content:
          "2400만원이야. 작년 수입 없고, 부양가족 없어. 국민연금 안 냈어.",
      },
      {
        role: "assistant",
        content:
          "소프트웨어 개발 프리랜서의 경우 컴퓨터 프로그래밍 서비스(940909)와 소프트웨어 개발 및 공급(940902) 중 어느 쪽에 가까우세요?",
      },
      { role: "user", content: "940909로 해줘. 계산해줘." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },
  {
    id: "calc_business_standard",
    description:
      "사업소득 기준경비율 케이스 — 주요경비 수집 후 tax_calculator 호출",
    messages: [
      {
        role: "user",
        content: "한식 음식점 운영하는데 2024년 세금 계산하고 싶어.",
      },
      { role: "assistant", content: "수입이 얼마였나요?" },
      {
        role: "user",
        content:
          "1억 5천만원이야. 작년도 1억 2천만원. 부양가족 2명, 국민연금 200만원.",
      },
      {
        role: "assistant",
        content:
          "기준경비율이 적용될 것 같아요. 주요경비(매입비용·임차료·인건비)를 알고 계신가요?",
      },
      {
        role: "user",
        content:
          "매입비용 4000만원, 임차료 1200만원, 인건비 2000만원이야. 계산해줘.",
      },
    ],
    expect: { toolCalled: "tax_calculator" },
  },
  {
    id: "legal_question_expense_rate",
    description: "경비율 개념 질문 — vector_search 호출, tax_calculator 미호출",
    messages: [
      { role: "user", content: "단순경비율이랑 기준경비율 차이가 뭐야?" },
    ],
    expect: { toolCalled: "vector_search", toolNotCalled: "tax_calculator" },
  },
  {
    id: "article_lookup",
    description: "조문 번호 직접 조회 — law_article_lookup 호출",
    messages: [{ role: "user", content: "소득세법 제70조가 뭐야?" }],
    expect: { toolCalled: "law_article_lookup" },
  },
  {
    id: "out_of_scope_employment",
    description: "근로소득 질문 — tax_calculator 미호출",
    messages: [
      {
        role: "user",
        content: "연봉 5000만원 직장인인데 근로소득세 계산해줘.",
      },
    ],
    expect: { toolNotCalled: "tax_calculator" },
  },
];
