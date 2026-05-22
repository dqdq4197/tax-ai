type Role = "user" | "assistant";

export type EvalCase = {
  id: string;
  /** 케이스 분류 — 집계 및 per-category 리포트에 사용 */
  category: "calc" | "legal" | "article" | "out-of-scope" | "info-gathering";
  description: string;
  messages: Array<{ role: Role; content: string }>;
  expect: {
    toolCalled?: "tax_calculator" | "vector_search" | "law_article_lookup";
    toolNotCalled?: "tax_calculator" | "vector_search";
    /** 응답에 포함되어야 할 정규식 패턴 (citation accuracy, content guard 용) */
    responsePattern?: string;
  };
};

export const GOLDEN_DATASET: EvalCase[] = [
  // ── 계산 ─────────────────────────────────────────────────────────────────

  {
    id: "calc_freelance_simple",
    category: "calc",
    description: "소프트웨어 프리랜서 단순경비율",
    messages: [
      { role: "user", content: "소프트웨어 개발 프리랜서야. 2024년 세금 계산하고 싶어." },
      { role: "assistant", content: "올해 총 수입이 얼마예요?" },
      { role: "user", content: "2400만원이야. 작년 수입 없고, 부양가족 없어. 국민연금 안 냈어." },
      { role: "assistant", content: "컴퓨터 프로그래밍 서비스(940909)와 소프트웨어 개발 및 공급(940902) 중 어느 쪽에 가까우세요?" },
      { role: "user", content: "940909로 해줘. 계산해줘." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },

  {
    id: "calc_business_standard",
    category: "calc",
    description: "한식 음식점 기준경비율 — 주요경비 포함",
    messages: [
      { role: "user", content: "한식 음식점 운영하는데 2024년 세금 계산하고 싶어." },
      { role: "assistant", content: "수입이 얼마였나요?" },
      { role: "user", content: "1억 5천만원이야. 작년도 1억 2천만원. 부양가족 2명, 국민연금 200만원." },
      { role: "assistant", content: "기준경비율이 적용될 것 같아요. 주요경비(매입비용·임차료·인건비)를 알고 계신가요?" },
      { role: "user", content: "매입비용 4000만원, 임차료 1200만원, 인건비 2000만원이야. 계산해줘." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },

  {
    id: "calc_new_business",
    category: "calc",
    description: "신규 사업자 — 직전연도 수입 0",
    messages: [
      { role: "user", content: "올해 처음 디자인 프리랜서 시작했어. 2024년 수입 3천만원인데 세금 얼마야?" },
      { role: "assistant", content: "신규 사업자시군요! 부양가족은 있으세요? 국민연금 내셨나요?" },
      { role: "user", content: "부양가족 없고 국민연금 안 냈어. 작년 수입은 없어." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },

  {
    id: "calc_2023_year",
    category: "calc",
    description: "2023년 귀속 세액 계산",
    messages: [
      { role: "user", content: "2023년 세금 계산하고 싶어. 웹디자이너 프리랜서야." },
      { role: "assistant", content: "2023년 귀속이군요. 총 수입이 얼마예요?" },
      { role: "user", content: "5천만원이야. 작년(2022년) 수입은 4천만원. 부양가족 없고 국민연금 150만원 냈어." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },

  {
    id: "calc_2025_year",
    category: "calc",
    description: "2025년 귀속 세액 계산",
    messages: [
      { role: "user", content: "2025년 세금 계산해줘. IT 프리랜서고 수입 6천만원, 작년 4천만원." },
      { role: "assistant", content: "부양가족 계신가요? 국민연금 내셨나요?" },
      { role: "user", content: "부양가족 1명, 국민연금 200만원." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },

  {
    id: "calc_2026_question",
    category: "calc",
    description: "2026년 질문 → 2025년 기준 안내 후 계산",
    messages: [
      { role: "user", content: "2026년 귀속 종합소득세 계산해줘. 번역 프리랜서고 수입 4천만원이야." },
      { role: "assistant", content: "2026년 귀속은 경비율이 아직 미발표라 2025년 기준으로 예상 세액을 안내해드릴게요. 작년(2025년) 수입과 부양가족 수를 알려주세요." },
      { role: "user", content: "작년 수입 3500만원, 부양가족 없어. 국민연금 안 냈어." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },

  {
    id: "calc_high_income",
    category: "calc",
    description: "고소득 소프트웨어 컨설턴트 — 최고 세율 구간",
    messages: [
      { role: "user", content: "소프트웨어 컨설팅 프리랜서야. 2024년 수입이 3억 2천만원이야. 작년은 2억 8천만원. 부양가족 없어." },
      { role: "assistant", content: "주요경비(매입·임차·인건비)가 있으신가요?" },
      { role: "user", content: "없어. 국민연금은 연 432만원 냈어. 계산해줘." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },

  {
    id: "calc_with_dependents",
    category: "calc",
    description: "부양가족 3명 — 학원 강사 프리랜서",
    messages: [
      { role: "user", content: "학원 강사 프리랜서야. 2024년 수입 5천만원, 작년 4500만원. 부양가족 3명이고 국민연금 180만원 냈어." },
      { role: "assistant", content: "강의 유형이 어떻게 되세요? 학원 강의인지 개인 과외인지에 따라 업종코드가 달라져요." },
      { role: "user", content: "수학·과학 학원에서 강의해. 계산해줘." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },

  {
    id: "calc_stability_fund",
    category: "calc",
    description: "일자리안정자금 수령 케이스",
    messages: [
      { role: "user", content: "소규모 음식점 운영해. 2024년 수입 5천만원, 작년 4천만원. 일자리안정자금 300만원 받았어." },
      { role: "assistant", content: "부양가족은 계신가요? 주요경비(매입·임차·인건비)가 있나요?" },
      { role: "user", content: "부양가족 없어. 매입 1000만원, 임차 600만원, 인건비 800만원. 국민연금 안 냈어." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },

  {
    id: "calc_pension_deduction",
    category: "calc",
    description: "국민연금 소득공제 포함 — 번역 프리랜서",
    messages: [
      { role: "user", content: "번역 프리랜서야. 2024년 수입 4800만원, 작년 3900만원. 국민연금 216만원 냈어. 부양가족 없어." },
      { role: "assistant", content: "출판번역인지 통역인지에 따라 업종코드가 달라져요. 어떤 유형이세요?" },
      { role: "user", content: "출판 번역이야. 계산해줘." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },

  {
    id: "calc_creator",
    category: "calc",
    description: "유튜버 — 구어체 직업명, 인적용역 사업소득",
    messages: [
      { role: "user", content: "유튜버인데 2024년 광고 수익 4500만원이야. 세금 계산해줘." },
      { role: "assistant", content: "유튜브 수익은 인적용역 사업소득이에요. 작년 수입은 얼마였나요? 부양가족·국민연금도 알려주세요." },
      { role: "user", content: "작년 3200만원, 부양가족 없어, 국민연금 안 냈어." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },

  {
    id: "calc_delivery_driver",
    category: "calc",
    description: "배달기사 — 운송업 인적용역",
    messages: [
      { role: "user", content: "배달 플랫폼 라이더야. 2024년에 3800만원 벌었어. 세금 얼마야?" },
      { role: "assistant", content: "배달 라이더는 운송 인적용역 사업소득이에요. 작년 수입과 부양가족·국민연금을 알려주세요." },
      { role: "user", content: "작년 3100만원, 부양가족 1명, 국민연금 안 냈어." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },

  {
    id: "calc_illustrator",
    category: "calc",
    description: "웹툰작가 — 원고료 사업소득",
    messages: [
      { role: "user", content: "웹툰 그리는데 2024년 원고료 수입 6천만원이야. 작년은 5천만원. 부양가족 없고 국민연금 216만원 냈어." },
      { role: "assistant", content: "웹툰 창작은 인적용역 사업소득이에요. 주요경비는 있으신가요?" },
      { role: "user", content: "없어. 계산해줘." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },

  {
    id: "calc_photographer",
    category: "calc",
    description: "웨딩 사진작가 — 예술 인적용역",
    messages: [
      { role: "user", content: "웨딩 사진 찍는 프리랜서야. 2024년 수입 3500만원, 작년 2800만원. 부양가족 2명이야." },
      { role: "assistant", content: "국민연금 내셨나요? 주요경비는 있으신가요?" },
      { role: "user", content: "국민연금 108만원, 주요경비 없어. 계산해줘." },
    ],
    expect: { toolCalled: "tax_calculator" },
  },

  // ── 법령 질문 ─────────────────────────────────────────────────────────────

  {
    id: "legal_expense_rate_diff",
    category: "legal",
    description: "단순경비율 vs 기준경비율 개념 차이",
    messages: [{ role: "user", content: "단순경비율이랑 기준경비율 차이가 뭐야?" }],
    expect: {
      toolCalled: "vector_search",
      toolNotCalled: "tax_calculator",
      responsePattern: "제\\d+조",
    },
  },

  {
    id: "legal_tax_rate",
    category: "legal",
    description: "종합소득세 세율 구간 질문",
    messages: [{ role: "user", content: "종합소득세 세율이 어떻게 돼? 몇 % 내야 해?" }],
    expect: {
      toolCalled: "vector_search",
      toolNotCalled: "tax_calculator",
      responsePattern: "제\\d+조",
    },
  },

  {
    id: "legal_filing_deadline",
    category: "legal",
    description: "종합소득세 신고 기한",
    messages: [{ role: "user", content: "종합소득세 신고 언제까지 해야 해?" }],
    expect: {
      toolCalled: "vector_search",
      toolNotCalled: "tax_calculator",
      responsePattern: "제\\d+조",
    },
  },

  {
    id: "legal_standard_tax_credit",
    category: "legal",
    description: "표준세액공제 개념 및 금액",
    messages: [{ role: "user", content: "표준세액공제가 뭐야? 얼마나 받을 수 있어?" }],
    expect: {
      toolCalled: "vector_search",
      toolNotCalled: "tax_calculator",
      responsePattern: "제\\d+조",
    },
  },

  {
    id: "legal_simple_eligibility",
    category: "legal",
    description: "단순경비율 적용 수입 기준",
    messages: [{ role: "user", content: "단순경비율 적용받으려면 수입이 얼마 이하여야 해?" }],
    expect: {
      toolCalled: "vector_search",
      toolNotCalled: "tax_calculator",
      responsePattern: "제\\d+조",
    },
  },

  {
    id: "legal_major_expenses",
    category: "legal",
    description: "기준경비율 주요경비 항목",
    messages: [{ role: "user", content: "기준경비율 방식에서 주요경비가 뭐야? 어떤 게 포함돼?" }],
    expect: {
      toolCalled: "vector_search",
      toolNotCalled: "tax_calculator",
      responsePattern: "제\\d+조",
    },
  },

  {
    id: "legal_business_income_def",
    category: "legal",
    description: "유튜버·블로거 수익 사업소득 해당 여부",
    messages: [{ role: "user", content: "유튜버 수익이나 블로그 광고 수익도 사업소득이야?" }],
    expect: {
      toolCalled: "vector_search",
      toolNotCalled: "tax_calculator",
    },
  },

  {
    id: "legal_interim_prepayment",
    category: "legal",
    description: "중간예납 개념 및 납부 시기",
    messages: [{ role: "user", content: "중간예납이 뭐야? 언제 내야 해?" }],
    expect: {
      toolCalled: "vector_search",
      toolNotCalled: "tax_calculator",
      responsePattern: "제\\d+조",
    },
  },

  {
    id: "legal_deduction_vs_credit",
    category: "legal",
    description: "소득공제 vs 세액공제 차이",
    messages: [{ role: "user", content: "소득공제랑 세액공제가 어떻게 달라? 뭐가 더 유리해?" }],
    expect: {
      toolCalled: "vector_search",
      toolNotCalled: "tax_calculator",
      responsePattern: "제\\d+조",
    },
  },

  {
    id: "legal_withholding_3_3",
    category: "legal",
    description: "3.3% 원천징수 개념",
    messages: [{ role: "user", content: "프리랜서 수당 받을 때 3.3% 떼이는 게 뭐야?" }],
    expect: {
      toolCalled: "vector_search",
      toolNotCalled: "tax_calculator",
      responsePattern: "제\\d+조",
    },
  },

  {
    id: "legal_dual_job",
    category: "legal",
    description: "투잡 — 복수 소득 합산 신고 의무 (구어체 → 법령 용어 변환 검증)",
    messages: [{ role: "user", content: "투잡인데 세금 신고 어떻게 해? 따로 따로 내야 해?" }],
    expect: {
      toolCalled: "vector_search",
      toolNotCalled: "tax_calculator",
      responsePattern: "제\\d+조",
    },
  },

  {
    id: "legal_business_vs_other_income",
    category: "legal",
    description: "사업소득 vs 기타소득 구분 — 강의료",
    messages: [{ role: "user", content: "외부 강의 한 번 하고 강의료 받으면 사업소득이야 기타소득이야?" }],
    expect: {
      toolCalled: "vector_search",
      toolNotCalled: "tax_calculator",
    },
  },

  {
    id: "legal_penalty_fallback",
    category: "legal",
    // 무신고가산세 실체 조문은 국세기본법 제47조의2 — 현재 미인덱싱
    // retrieval empty 시 agent가 fallback 메시지를 출력하는지 검증
    description: "무신고 가산세 질문 — 국세기본법 미인덱싱 → fallback 검증",
    messages: [{ role: "user", content: "종합소득세 신고 안 하면 어떻게 돼? 가산세 있어?" }],
    expect: {
      toolCalled: "vector_search",
      toolNotCalled: "tax_calculator",
      responsePattern: "세무사|찾지 못했|가산세",
    },
  },

  {
    id: "legal_local_income_tax",
    category: "legal",
    description: "지방소득세 개념 및 세율",
    messages: [{ role: "user", content: "지방소득세가 뭐야? 따로 내야 해?" }],
    expect: {
      toolCalled: "vector_search",
      toolNotCalled: "tax_calculator",
    },
  },

  // ── 조문 직접 조회 ────────────────────────────────────────────────────────

  {
    id: "article_70_filing",
    category: "article",
    description: "소득세법 제70조 종합소득과세표준 확정신고 원문",
    messages: [{ role: "user", content: "소득세법 제70조가 뭐야?" }],
    expect: {
      toolCalled: "law_article_lookup",
      responsePattern: "제70조",
    },
  },

  {
    id: "article_19_business_income",
    category: "article",
    description: "소득세법 제19조 사업소득 정의 원문",
    messages: [{ role: "user", content: "소득세법 제19조 알려줘." }],
    expect: {
      toolCalled: "law_article_lookup",
      responsePattern: "제19조",
    },
  },

  {
    id: "article_55_tax_rate",
    category: "article",
    description: "소득세법 제55조 세율 원문",
    messages: [{ role: "user", content: "소득세법 제55조 보여줘." }],
    expect: {
      toolCalled: "law_article_lookup",
      responsePattern: "제55조",
    },
  },

  {
    id: "article_50_basic_deduction",
    category: "article",
    description: "소득세법 제50조 기본공제 원문",
    messages: [{ role: "user", content: "소득세법 제50조 알려줘." }],
    expect: {
      toolCalled: "law_article_lookup",
      responsePattern: "제50조",
    },
  },

  {
    id: "article_143_expense_rate",
    category: "article",
    description: "소득세법 시행령 제143조 경비율 원문",
    messages: [{ role: "user", content: "소득세법 시행령 제143조 내용이 뭐야?" }],
    expect: {
      toolCalled: "law_article_lookup",
      responsePattern: "제143조",
    },
  },

  // ── 범위 외 ───────────────────────────────────────────────────────────────

  {
    id: "out_of_scope_employment",
    category: "out-of-scope",
    description: "근로소득 계산 요청 — 거절 및 세무사 안내",
    messages: [{ role: "user", content: "연봉 5000만원 직장인인데 근로소득세 계산해줘." }],
    expect: {
      toolNotCalled: "tax_calculator",
      responsePattern: "세무사|근로소득|도움드리기 어려",
    },
  },

  {
    id: "out_of_scope_rental",
    category: "out-of-scope",
    description: "부동산 임대소득 — 범위 외",
    messages: [{ role: "user", content: "아파트 월세 받는데 임대소득세 얼마야?" }],
    expect: {
      toolNotCalled: "tax_calculator",
      responsePattern: "세무사|임대|도움드리기 어려",
    },
  },

  {
    id: "out_of_scope_financial",
    category: "out-of-scope",
    description: "주식 배당금 — 금융소득 범위 외",
    messages: [{ role: "user", content: "주식 배당금 3천만원 받았는데 세금 얼마야?" }],
    expect: {
      toolNotCalled: "tax_calculator",
      responsePattern: "세무사|금융소득|도움드리기 어려",
    },
  },

  {
    id: "out_of_scope_pension",
    category: "out-of-scope",
    description: "연금소득 — 범위 외",
    messages: [{ role: "user", content: "퇴직연금 받기 시작했는데 연금소득세 계산해줘." }],
    expect: {
      toolNotCalled: "tax_calculator",
      responsePattern: "세무사|연금|도움드리기 어려",
    },
  },

  {
    id: "out_of_scope_crypto",
    category: "out-of-scope",
    description: "가상자산 양도소득 — 범위 외",
    messages: [{ role: "user", content: "비트코인 팔아서 2천만원 벌었는데 세금 내야 해?" }],
    expect: {
      toolNotCalled: "tax_calculator",
      responsePattern: "세무사|가상자산|도움드리기 어려",
    },
  },

  {
    id: "out_of_scope_mixed_income",
    category: "out-of-scope",
    description: "근로소득 + 프리랜서 혼합 — 근로소득 계산 거절",
    messages: [
      { role: "user", content: "직장 다니면서 부업으로 프리랜서도 해. 연봉 4천만원이고 프리랜서 수입 1500만원인데 세금 계산해줘." },
    ],
    expect: {
      toolNotCalled: "tax_calculator",
    },
  },

  // ── 정보 수집 중 ──────────────────────────────────────────────────────────

  {
    id: "info_gathering_no_income",
    category: "info-gathering",
    description: "업종만 말하고 수입 미제공 — calculator 아직 미호출",
    messages: [{ role: "user", content: "디자이너 프리랜서야. 세금 계산해줘." }],
    expect: { toolNotCalled: "tax_calculator" },
  },

  {
    id: "info_gathering_no_year",
    category: "info-gathering",
    description: "귀속 연도 미확인 — calculator 아직 미호출",
    messages: [{ role: "user", content: "세금 계산하고 싶어. 수입 3000만원이야." }],
    expect: { toolNotCalled: "tax_calculator" },
  },

  {
    id: "info_gathering_standard_need_expenses",
    category: "info-gathering",
    description: "기준경비율 대상인데 주요경비 미제공 — calculator 미호출",
    messages: [
      { role: "user", content: "2024년 음식점 운영해서 2억 벌었어. 작년도 1억 8천만원. 부양가족 없어. 세금 계산해줘." },
    ],
    expect: { toolNotCalled: "tax_calculator" },
  },

  {
    id: "info_gathering_occupation_unclear",
    category: "info-gathering",
    description: "직업 불명확 — 업종코드 확인 전 calculator 미호출",
    messages: [{ role: "user", content: "프리랜서야. 2024년 수입 5000만원. 계산해줘." }],
    expect: { toolNotCalled: "tax_calculator" },
  },
];
