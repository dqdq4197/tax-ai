# RAG 파이프라인

프레임워크 없이 직접 구현. Voyage AI 임베딩 + pgvector + 직접 SQL.

## 전체 흐름

```
[Ingestion - pnpm db:seed]          [Retrieval - vector_search tool 호출 시]

data/laws/*.txt                      유저 질의 관련 쿼리 문자열
      │                                        │
      ▼                                        ▼
  조(條) 단위 청킹                  Voyage AI 임베딩 (query type)
      │                                        │
      ▼                                        ▼
Voyage AI 임베딩 (document type)    pgvector cosine 유사도 검색
      │                                        │
      ▼                                        ▼
  pgvector 저장                      상위 5개 청크 → LLM context
```

---

## 문서 준비

**출처**: 법제처 국가법령정보센터 (law.go.kr)  
**형식**: 텍스트(.txt) 권장. PDF는 파싱 노이즈가 많아 비추.  
**대상**: 소득세법, 소득세법 시행령 (세율·공제 조항 중심)

```
data/
└── laws/
    ├── 소득세법.txt
    └── 소득세법_시행령.txt
```

---

## Ingestion 스크립트

```typescript
// scripts/seed-laws.ts

// incomeTypes: 해당 조항이 관련된 소득 유형 목록
// 빈 배열([])은 소득 유형 공통 조항 (세율표, 기본공제 등)
// 소득 유형 추가 시 FILES에 항목을 추가하고 incomeTypes를 태깅하면 된다
const FILES = [
  {
    path:        'data/laws/소득세법.txt',
    source:      '소득세법',
    incomeTypes: [],                          // 공통 조항 (세율, 기본공제 등)
  },
  {
    path:        'data/laws/소득세법_시행령.txt',
    source:      '소득세법 시행령',
    incomeTypes: [],
  },
  {
    path:        'data/laws/사업소득_필요경비.txt',
    source:      '소득세법',
    incomeTypes: ['business', 'freelance'],   // 사업소득 전용 조항
  },
  // 확장 예시:
  // { path: 'data/laws/근로소득.txt', source: '소득세법', incomeTypes: ['employment'] },
]

async function main() {
  for (const file of FILES) {
    const text = readFileSync(file.path, 'utf-8')
    const chunks = chunkByArticle(text)

    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.content)
      await db.insert(lawChunks).values({
        content:   chunk.content,
        embedding,
        metadata: {
          source:      file.source,
          article:     chunk.article,
          title:       chunk.title,
          year:        2024,
          incomeTypes: file.incomeTypes,
        },
      })
      console.log(`저장: ${file.source} ${chunk.article}`)
    }
  }
  console.log('완료')
  process.exit(0)
}

main()
```

### 청킹 전략

법령 텍스트는 `제N조(제목)` 패턴으로 구성되어 있어 조(條) 단위 분리를 1순위로 시도한다.

```typescript
// scripts/chunk.ts

const ARTICLE_PATTERN = /제(\d+)조(?:의\d+)?\s*\(([^)]+)\)/g
const MAX_TOKENS = 500
const OVERLAP_TOKENS = 50

export function chunkByArticle(text: string): Chunk[] {
  const articles = splitByArticle(text)  // ARTICLE_PATTERN 기준 분할

  return articles.flatMap((article) => {
    // 500 tokens 이하: 그대로 사용
    if (estimateTokens(article.content) <= MAX_TOKENS) {
      return [article]
    }
    // 500 tokens 초과: 문장 경계로 2차 분할 (overlap 포함)
    return splitByTokens(article.content, MAX_TOKENS, OVERLAP_TOKENS)
      .map((content) => ({ ...article, content }))
  })
}
```

조 단위 분리가 되지 않는 형식이면 토큰 기반 고정 청킹으로 fallback한다.

---

## Voyage AI 클라이언트

```typescript
// src/lib/voyage.ts

export async function getEmbedding(text: string): Promise<number[]> {
  const res = await voyage.embed({ input: text, model: 'voyage-3', inputType: 'document' })
  return res.data[0].embedding
}

export async function getQueryEmbedding(text: string): Promise<number[]> {
  const res = await voyage.embed({ input: text, model: 'voyage-3', inputType: 'query' })
  return res.data[0].embedding
}
```

`inputType` 구분: 문서 저장 시 `'document'`, 검색 쿼리 시 `'query'`. 동일 모델이라도 최적화 방식이 달라 검색 품질에 영향을 준다.

---

## Retrieval

`vector_search` tool 내부에서 호출된다. `incomeType`을 받아 관련 조항만 검색한다.

```typescript
// src/db/queries/law-chunks.ts

export async function searchLawChunks(
  embedding: number[],
  incomeType: string,
  limit = 5,
) {
  return db
    .select({
      content:    lawChunks.content,
      metadata:   lawChunks.metadata,
      similarity: sql<number>`1 - (${lawChunks.embedding} <=> ${embedding}::vector)`,
    })
    .from(lawChunks)
    .where(
      and(
        sql`1 - (${lawChunks.embedding} <=> ${embedding}::vector) > 0.7`,
        // 공통 조항(incomeTypes=[]) 또는 해당 소득 유형 조항 포함
        sql`${lawChunks.metadata}->>'incomeTypes' = '[]'
            OR ${lawChunks.metadata}->'incomeTypes' ? ${incomeType}`,
      )
    )
    .orderBy(sql`${lawChunks.embedding} <=> ${embedding}::vector`)
    .limit(limit)
}
```

```typescript
// src/agent/tools.ts - vector_search tool 파라미터
vector_search: {
  parameters: z.object({
    query:      z.string(),
    incomeType: z.enum(['business', 'freelance']),
  }),
  execute: async ({ query, incomeType }) => {
    const embedding = await getQueryEmbedding(query)
    return searchLawChunks(embedding, incomeType)
  },
}
```

---

## 실행

```bash
# 문서 준비
mkdir -p data/laws
# data/laws/소득세법.txt 등 복사

# DB에 세법 데이터 삽입 (최초 1회, 법령 개정 시 재실행)
pnpm db:seed
```

세법 데이터는 자주 변경되지 않으므로 연 1회 re-ingestion 예상. 기존 데이터는 삽입 전 삭제 후 재삽입하는 방식으로 관리한다.
