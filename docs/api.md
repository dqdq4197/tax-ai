# API 설계

Next.js Route Handlers (`src/app/api/`). Vercel 배포 시 Serverless Functions(AWS Lambda)로 동작.

## 엔드포인트

| Method | Path | 역할 |
|---|---|---|
| POST | `/api/chat` | 채팅 스트리밍 + 세션 자동 생성 |
| GET  | `/api/sessions` | 세션 목록 조회 |
| GET  | `/api/sessions/[id]/messages` | 세션 메시지 이력 조회 |

---

## POST /api/chat

핵심 엔드포인트. 세션 자동 생성, user 메시지 저장, 스트리밍 응답, tool 호출을 모두 처리한다.

**Request**
```typescript
{
  messages: { role: 'user' | 'assistant'; content: string }[]
  sessionId?: string  // 없으면 새 세션 생성
}
```

**Response**
- `text/event-stream` (Vercel AI SDK Data Stream)
- 헤더에 `X-Session-Id: <sessionId>` 포함 (신규 세션 생성 시 클라이언트가 URL 교체에 활용)

**구현**
```typescript
// src/app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages, sessionId: existingId } = await req.json()

  // 세션 없으면 생성
  const sessionId = existingId ?? await createSession()
  const trace = langfuse.trace({ name: 'chat', sessionId })

  // user 메시지 저장 (암호화)
  const userMessage = messages.at(-1)
  await saveMessage(sessionId, { role: 'user', content: userMessage.content })

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: buildSystemPrompt(),
    messages,
    tools,          // tax_calculator.execute 내부에서 verifyResult 호출
    maxSteps: 10,
    onFinish: async ({ text, toolCalls }) => {
      await saveMessage(sessionId, { role: 'assistant', content: text, toolCalls })
      trace.update({ output: { text } })
    },
  })

  return result.toDataStreamResponse({
    headers: { 'X-Session-Id': sessionId },
  })
}
```

**클라이언트에서 신규 세션 처리**
```typescript
// useChat의 onResponse 콜백에서 URL 교체
onResponse: (response) => {
  const newSessionId = response.headers.get('X-Session-Id')
  if (!existingSessionId && newSessionId) {
    router.replace(`/chat/${newSessionId}`, { scroll: false })
  }
}
```

**tool 호출 흐름**
1. 유저가 소득 정보를 대화로 입력
2. LLM이 `vector_search` 호출 → 관련 세법 조항 검색
3. LLM이 `tax_calculator` 호출 → 결정적 계산 + 내부 검증
4. 검증 실패 시 tool이 오류 반환 → LLM이 `maxSteps` 내 재시도
5. 최종 결과를 자연어로 스트리밍

---

## GET /api/sessions

세션 목록을 최신순으로 반환한다. 홈 페이지에서 사용.

**Response**
```typescript
{
  sessions: {
    id: string
    createdAt: string
    preview: string   // 첫 번째 user 메시지 앞 50자 (복호화)
  }[]
}
```

---

## GET /api/sessions/[id]/messages

특정 세션의 메시지 전체를 복호화하여 반환한다. 이어보기 시 `useChat`의 `initialMessages`로 주입.

**Response**
```typescript
{
  messages: {
    id: string
    role: 'user' | 'assistant'
    content: string   // 복호화된 텍스트
    toolCalls?: unknown[]
    createdAt: string
  }[]
}
```

---

## 공통 에러 응답

```typescript
{ error: string; code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR' }
```

500 응답 시 상세 내용은 서버 로그에만, 클라이언트에는 generic message 반환.
