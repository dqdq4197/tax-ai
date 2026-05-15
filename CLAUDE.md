# Tax-Pilot

종합소득세 AI 챗봇 서비스.  
사업소득·프리랜서 소득을 가진 유저가 대화로 정보를 입력하면 세법 조항을 검색하고 세액을 계산하여 스트리밍으로 응답한다.

**상담 범위**: 사업소득·프리랜서(사업소득)에 한정. 근로·금융·연금·기타소득 제외.  
소득 유형마다 세액 계산 산식이 다르며, 임베딩 추가만으로 커버되지 않는다.

## 핵심 설계 원칙

- **LLM은 계산하지 않는다**: 세액 계산은 항상 서버의 결정적 함수(`tax_calculator`)를 tool로 호출한다.
- **검증은 tool 내부에서**: `tax_calculator.execute`에서 `verifyResult()`를 호출하고, 실패 시 오류를 반환해 LLM이 `maxSteps` 내에서 재시도한다.
- **모든 메시지는 기록된다**: user/assistant 메시지와 tool 호출 이력을 `messages` 테이블에 저장한다.
- **모든 메시지는 암호화된다**: content는 SEED 알고리즘으로 암호화 저장, 조회 시 복호화.

## 기술 스택

| 역할 | 기술 |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI SDK | Vercel AI SDK (`useChat` + `streamText`) |
| LLM | Anthropic Claude (claude-sonnet-4-5) |
| Embedding | Voyage AI (voyage-3) |
| ORM | Drizzle ORM |
| DB | PostgreSQL + pgvector (Neon) |
| LLMOps | Langfuse |
| 암호화 | crypto-js (SEED) |
| 배포 | Vercel + Neon |

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
├── app/
│   ├── page.tsx                    # 세션 목록 (홈)
│   ├── chat/
│   │   └── [sessionId]/page.tsx   # 채팅 UI
│   └── api/
│       ├── chat/route.ts           # streamText + tools (핵심 엔드포인트)
│       └── sessions/
│           └── [id]/
│               └── messages/route.ts  # 세션 메시지 이력 조회
├── agent/
│   ├── tools.ts              # vector_search, tax_calculator tool 정의
│   ├── verify.ts             # 계산 결과 결정적 검증 (tax_calculator 내부에서 호출)
│   ├── prompts.ts            # 시스템 프롬프트
│   └── calculators/
│       ├── index.ts          # 소득 유형 → 계산기 라우팅 (전략 패턴)
│       └── business.ts       # 사업/프리랜서 세액 계산 (현재 유일한 구현체)
│       # 확장 시: employment.ts, financial.ts 추가 후 index.ts에 등록
├── db/
│   ├── schema.ts
│   ├── index.ts
│   └── queries/
│       ├── sessions.ts
│       ├── messages.ts
│       └── law-chunks.ts
├── lib/
│   ├── langfuse.ts
│   ├── encryption.ts         # SEED 암호화/복호화
│   └── voyage.ts
└── types/
    └── index.ts
```

## 세션 흐름

```
/               세션 목록 (이전 대화 이어보기)
  │
  ├── 새 상담    /chat 접속 → 첫 메시지 전송 시 세션 자동 생성
  │              응답과 함께 sessionId 반환 → URL을 /chat/[sessionId]로 교체
  │
  └── 이어보기   /chat/[sessionId] 접속 → GET /api/sessions/[id]/messages
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
LANGFUSE_HOST=
SEED_ENCRYPTION_KEY=
```

## 참고 문서

- [아키텍처](docs/architecture.md)
- [에이전트 설계](docs/agent-workflow.md)
- [DB 스키마](docs/database.md)
- [API 설계](docs/api.md)
- [RAG 파이프라인](docs/rag-pipeline.md)
