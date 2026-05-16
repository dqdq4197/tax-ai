# tax-ai

종합소득세 AI 챗봇 서비스.  
사업소득·프리랜서 소득을 가진 유저가 대화로 정보를 입력하면 세법 조항을 검색하고 세액을 계산하여 스트리밍으로 응답한다.

**상담 범위**: 사업소득·프리랜서(사업소득)에 한정. 근로·금융·연금·기타소득 제외.  
소득 유형마다 세액 계산 산식이 다르며, 임베딩 추가만으로 커버되지 않는다.

## 세법 데이터 작성 원칙

> **이 규칙은 절대 규칙이다. 예외 없이 적용한다.**

- **공식 출처만 허용**: 세율, 경비율, 공제 한도, 기준금액 등 모든 수치는 반드시 공식 법령 또는 국세청 고시에서 직접 인용한다.
  - 허용: 국가법령정보센터(law.go.kr), 국세청(nts.go.kr), 기획재정부(moef.go.kr)
  - **금지**: 블로그, 뉴스 기사, Q&A 사이트(아하·네이버 지식인 등), 위키, 세무사 홈페이지 해설, 기타 비공식 출처
- **임의 판단 금지**: 법령 원문을 직접 확인하지 못한 수치는 코드에 절대 작성하지 않는다.
- **불확실 항목 명시**: 출처를 확인하지 못한 경우 `// TODO: 법령 원문 확인 필요 — [조항명]` 주석으로 표시하고, 해당 값은 코드에 넣지 않는다.
- **출처 기록 의무**: 모든 수치 상수는 법령 근거(예: `소득세법 시행령 제143조`)를 주석 또는 `docs/`에 기록한다.
- **탐색 방법**: 공식 출처 탐색이 필요할 때는 `/tax-research [질문]` 커맨드를 사용한다.

---

## 핵심 설계 원칙

- **LLM은 계산하지 않는다**: 세액 계산은 항상 서버의 결정적 함수(`tax_calculator`)를 tool로 호출한다.
- **검증은 tool 내부에서**: `tax_calculator.execute`에서 `verifyResult()`를 호출하고, 실패 시 오류를 반환해 LLM이 `maxSteps` 내에서 재시도한다.
- **모든 메시지는 기록된다**: user/assistant 메시지와 tool 호출 이력을 `messages` 테이블에 저장한다.
- **모든 메시지는 암호화된다**: content는 AES-256-GCM으로 암호화 저장, 조회 시 복호화.

## 기술 스택

| 역할       | 기술                                     |
| ---------- | ---------------------------------------- |
| Framework  | Next.js 15 (App Router)                  |
| Language   | TypeScript                               |
| Styling    | Tailwind CSS                             |
| AI SDK     | Vercel AI SDK (`useChat` + `streamText`) |
| LLM        | Anthropic Claude (claude-sonnet-4-5)     |
| Embedding  | Voyage AI (voyage-3)                     |
| ORM        | Drizzle ORM                              |
| DB         | PostgreSQL + pgvector (Neon)             |
| LLMOps     | Langfuse                                 |
| Encryption | Node.js crypto (AES-256-GCM)             |
| Deploy     | Vercel + Neon                            |

## 주요 명령어

```bash
pnpm dev          # 개발 서버 (localhost:3000)
pnpm type-check   # tsc --noEmit
pnpm db:generate  # Drizzle 마이그레이션 파일 생성
pnpm db:migrate   # 마이그레이션 실행
pnpm db:studio    # Drizzle Studio
pnpm db:seed      # 세법 데이터 pgvector에 삽입
```

## 프로젝트 구조

```
src/
├── app/                            # Next.js 라우팅 레이어 (클라이언트 + API routes)
│   ├── page.tsx                    # 대화 목록 (홈)
│   ├── chat/
│   │   └── [conversationId]/page.tsx   # 채팅 UI
│   └── api/
│       ├── chat/route.ts           # streamText + tools (핵심 엔드포인트)
│       └── conversations/
│           └── [id]/
│               └── messages/route.ts  # 대화 메시지 이력 조회
└── server/                         # 서버 전용 코드 (클라이언트에서 import 불가)
    ├── agent/
    │   ├── types.ts              # TaxInput, TaxResult, IncomeType 등 agent 전용 타입
    │   ├── tools.ts              # vector_search, tax_calculator tool 정의
    │   ├── verify.ts             # 계산 결과 결정적 검증 (tax_calculator 내부에서 호출)
    │   ├── prompts.ts            # 시스템 프롬프트
    │   └── calculators/
    │       ├── index.ts          # 소득 유형 → 계산기 라우팅 (전략 패턴)
    │       └── business/         # 사업/프리랜서 (현재 유일한 구현체)
    │           ├── index.ts      # 세액 계산 진입점
    │           ├── business-expense-rates/  # 업종코드별 경비율 (국세청 고시)
    │           │   ├── 2024.json
    │           │   ├── schema.ts
    │           │   └── thresholds.ts
    │           └── tax-brackets/            # 종합소득세율 구간 (소득세법 제55조)
    │               ├── 2024.json
    │               └── schema.ts
    │       # 확장 시: employment/ 폴더 추가 후 calculators/index.ts에 등록
    ├── db/
    │   ├── conversations/
    │   │   ├── schema.ts
    │   │   └── queries.ts
    │   ├── messages/
    │   │   ├── schema.ts
    │   │   └── queries.ts
    │   ├── law-chunks/
    │   │   ├── schema.ts
    │   │   └── queries.ts
    │   └── index.ts
    └── utils/
        ├── encryption/
        │   └── aes256gcm.ts      # AES-256-GCM 암호화/복호화
        ├── voyage/
        │   └── index.ts          # Voyage AI 임베딩 클라이언트
        └── langfuse/
            └── index.ts          # Langfuse 옵저버빌리티 클라이언트
```

## 대화 흐름

```
/               대화 목록 (이전 대화 이어보기)
  │
  ├── 새 상담    /chat 접속 → 첫 메시지 전송 시 conversation 자동 생성
  │              응답과 함께 conversationId 반환 → URL을 /chat/[conversationId]로 교체
  │
  └── 이어보기   /chat/[conversationId] 접속 → GET /api/conversations/[id]/messages
                  → useChat initialMessages로 이전 대화 복원
```

## 코드 컨벤션

- 파일명: `kebab-case`
- 컴포넌트: `PascalCase`
- 함수/변수: `camelCase`
- DB 컬럼: `snake_case`

## 환경변수 (.env.local)

```
DATABASE_URL=
ANTHROPIC_API_KEY=
VOYAGE_API_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_BASE_URL=
ENCRYPTION_KEY=
```

## 참고 문서

- [아키텍처](docs/architecture.md)
- [에이전트 설계](docs/agent-workflow.md)
- [DB 스키마](docs/database.md)
- [API 설계](docs/api.md)
- [RAG 파이프라인](docs/rag-pipeline.md)
