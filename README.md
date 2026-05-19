# tax-ai (종합소득세 AI 상담 챗봇)

사업소득·프리랜서 소득자가 대화로 정보를 입력하면, 세법 조항을 검색하고 세액을 계산해 스트리밍으로 응답합니다.

---

## 주요 기능

- **대화형 세금 상담** — 자연어로 소득·비용 정보를 입력하면 단계적으로 세액 산출
- **세법 조항 검색** — vector embedding으로 소득세법·시행령 원문을 의미 기반 검색, 법 조항 인용
- **결정론적 세액 계산** — LLM이 아닌 서버 함수(`tax_calculator`)로 계산, 내부 검증 후 결과 반환
- **경비율 자동 선택** — 업종코드와 수입 금액에 따라 단순/기준경비율 자동 선택
- **대화 이력 저장** — 모든 메시지 AES-256-GCM 암호화 후 DB 저장, 이전 상담 이어보기 가능

---

## 기술 스택

| 영역          | 기술                                    |
| ------------- | --------------------------------------- |
| Framework     | Next.js 16 (App Router)                 |
| Language      | TypeScript                              |
| Styling       | Tailwind CSS v4 + shadcn/ui             |
| AI SDK        | Vercel AI SDK (`streamText`, `useChat`) |
| LLM           | Google Gemini 2.5 Flash                 |
| Embedding     | Voyage AI (voyage-3, 1024-dim)          |
| ORM           | Drizzle ORM                             |
| DB            | PostgreSQL + pgvector (Neon)            |
| Observability | Langfuse                                |
| Encryption    | Node.js crypto (AES-256-GCM)            |
| Deploy        | Vercel + Neon                           |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                         # 대화 목록 (홈)
│   ├── chat/[conversationId]/           # 채팅 UI
│   └── api/
│       ├── chat/route.ts                # 핵심 엔드포인트 — streamText + tool 실행
│       └── conversations/[id]/          # 대화 조회·수정 API
└── server/
    ├── agent/
    │   ├── tools.ts                     # vector_search, law_article_lookup, tax_calculator 정의
    │   ├── prompts.ts                   # 시스템 프롬프트
    │   └── calculators/
    │       └── business/                # 사업소득 세액 계산 로직 (경비율, 세율 구간)
    ├── db/                              # Drizzle 스키마 + 쿼리 (conversations, messages, law-chunks)
    └── utils/
        ├── encryption/aes256gcm.ts
        ├── voyage/                      # 임베딩 클라이언트
        └── langfuse/                    # 옵저버빌리티 클라이언트
```

---

## 대화 흐름

```
1. 첫 메시지 전송 → conversation 자동 생성 → URL /chat/[id]로 교체
2. POST /api/chat → streamText(LLM + tools)
     ├── vector_search      : 세법 DB에서 관련 조항 검색
     ├── law_article_lookup : 특정 조문 조회
     └── tax_calculator     : 세액 계산 (서버 함수 실행 → 검증 → 결과 반환)
3. 응답 스트리밍 → 메시지 암호화 저장
```

---

## 아키텍처 핵심 원칙

- **LLM은 계산하지 않는다** — 세액 계산은 항상 서버의 결정론적 함수로 위임, LLM은 파라미터만 추출
- **검증은 tool 내부에서** — `tax_calculator.execute`에서 `verifyResult()` 호출, 실패 시 LLM이 `maxSteps` 내 재시도
- **모든 메시지는 암호화된다** — 민감 세무 정보 보호 (AES-256-GCM)
- **세법 데이터는 공식 출처만** — law.go.kr / nts.go.kr 원문만 허용, 비공식 출처 금지

---

## 참고 문서

- [아키텍처](docs/architecture.md)
- [에이전트 설계](docs/agent-workflow.md)
- [DB 스키마](docs/database.md)
- [API 설계](docs/api.md)
- [RAG 파이프라인](docs/rag-pipeline.md)
