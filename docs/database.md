# DB 스키마

ORM: Drizzle ORM / DB: PostgreSQL (Neon) / Extension: pgvector  
드라이버: `@neondatabase/serverless` (Vercel 서버리스 커넥션 풀링 기본 지원)

## 테이블 목록

| 테이블 | 역할 |
|---|---|
| `sessions` | 상담 세션 관리 |
| `messages` | 대화 이력 및 tool 호출 기록 |
| `law_chunks` | 세법 문서 벡터 (RAG) |

---

## sessions

```typescript
export const sessions = pgTable('sessions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

---

## messages

대화 메시지와 tool 호출 이력을 함께 저장한다.

```typescript
export const messages = pgTable('messages', {
  id:        uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id),
  role:      text('role').$type<'user' | 'assistant'>().notNull(),
  content:   text('content').notNull(),    // SEED 암호화된 텍스트
  toolCalls: jsonb('tool_calls'),          // assistant 메시지의 tool 호출 이력
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

**암호화 규칙**:
- `content`는 저장 시 항상 SEED 암호화. 조회 시 복호화 후 반환.
- user/assistant 구분 없이 모든 메시지에 적용.

**toolCalls 구조** (assistant 메시지에만 존재):
```json
[
  {
    "toolName": "vector_search",
    "input": { "query": "소득세법 세율 2024" },
    "output": [{ "article": "제55조", "content": "..." }]
  },
  {
    "toolName": "tax_calculator",
    "input": { "totalIncome": 50000000, "dependents": 2 },
    "output": { "finalTax": 5765000, "taxRate": 0.24 }
  }
]
```

---

## law_chunks

세법 문서 벡터. RAG 지식 베이스.  
**대상**: 소득세법, 소득세법 시행령 중 사업소득·세율·공제 관련 조항.

```typescript
export const lawChunks = pgTable('law_chunks', {
  id:        uuid('id').primaryKey().defaultRandom(),
  content:   text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1024 }).notNull(), // voyage-3
  metadata:  jsonb('metadata').$type<{
               source: string        // "소득세법"
               article: string       // "제55조"
               title: string         // "세율"
               year: number
               incomeTypes: string[] // ["business", "freelance"] | [] = 공통 조항
             }>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const embeddingIndex = index('law_chunks_embedding_idx')
  .on(lawChunks.embedding)
  .using('hnsw')
  .with({ m: 16, ef_construction: 64 })
```

### 검색 쿼리

```typescript
// src/db/queries/law-chunks.ts
export async function searchLawChunks(embedding: number[], limit = 5) {
  return db
    .select({
      content:    lawChunks.content,
      metadata:   lawChunks.metadata,
      similarity: sql<number>`1 - (${lawChunks.embedding} <=> ${embedding}::vector)`,
    })
    .from(lawChunks)
    .where(sql`1 - (${lawChunks.embedding} <=> ${embedding}::vector) > 0.7`)
    .orderBy(sql`${lawChunks.embedding} <=> ${embedding}::vector`)
    .limit(limit)
}
```

---

## 마이그레이션

스키마 변경 순서: `schema.ts` 수정 → `pnpm db:generate` → `pnpm db:migrate`  
`migrations/` 파일 수동 수정 금지.
