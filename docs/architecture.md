# 아키텍처

## 전체 흐름

```
유저 (브라우저)
  │
  │  useChat hook (Vercel AI SDK)
  ▼
app/chat/[sessionId]
  │
  │  POST /api/chat  (메시지마다)
  ▼
Route Handler: streamText()
  │
  ├── tool: vector_search  ──▶  pgvector (세법 검색)
  │
  ├── tool: tax_calculator  ──▶  결정적 계산 함수
  │         │
  │         └── verifyResult()  ──▶  수식 검증 (실패 시 재시도)
  │
  └── 스트리밍 응답  ──▶  유저 화면에 실시간 표시

  (비동기) 메시지 + tool 이력 DB 저장
```

## 설계 결정

**`/api/chat` 단일 엔드포인트**

별도 `/api/consult` 없이 채팅 Route Handler 안에서 tool calling이 일어난다.  
LLM이 대화 흐름에서 충분한 정보가 모이면 자연스럽게 `tax_calculator`를 호출한다.

**단일 에이전트 + multi-step tool use**

`streamText`에 tool을 등록하고, LLM이 필요한 순서대로 호출한다.  
흐름이 선형인 이 워크플로우에서 에이전트를 여러 개로 나누는 것은 복잡도만 높인다.

**검증은 결정적 함수로**

수식 검증(세율 적용, 공제 합산 등)은 LLM 대신 순수 함수 `verifyResult()`로 처리한다.

**메시지 저장은 비동기**

스트리밍 응답을 블로킹하지 않기 위해 DB 저장은 응답 완료 후 비동기로 처리한다.

## 컴포넌트 책임

| 컴포넌트 | 위치 | 역할 |
|---|---|---|
| 채팅 UI | `app/chat/[sessionId]` | `useChat` 기반 대화 인터페이스 |
| 채팅 API | `app/api/chat/route.ts` | `streamText` + tools, DB 저장 |
| tool 정의 | `agent/tools.ts` | `vector_search`, `tax_calculator` |
| 결과 검증 | `agent/verify.ts` | 수식 검증 순수 함수 |
| RAG 검색 | `db/queries/law-chunks.ts` | pgvector cosine 검색 |
