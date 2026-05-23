# 세법 DB seed 가이드

법령 HWPX 파일을 파싱해 청킹·임베딩 후 pgvector DB에 삽입하는 파이프라인입니다.

---

## 전체 흐름

```
data/raw/*.hwpx
    │
    │  pnpm parse-hwpx
    ▼
data/raw/*.json          ← 구조화된 법령 JSON (parse-hwpx.ts 출력)
    │
    │  pnpm db:seed
    ▼
청킹 (chunk.ts)          ← 조 단위 분할 + 항 단위 overflow 처리
    │
    ▼
임베딩 (Voyage AI)       ← voyage-3.5, inputType: "document"
    │
    ▼
pgvector DB 삽입         ← law_chunks 테이블
```

---

## 사전 조건

`.env.local`에 아래 두 항목이 설정되어 있어야 합니다.

```bash
DATABASE_URL=        # Neon PostgreSQL 연결 문자열
VOYAGE_API_KEY=      # Voyage AI API 키
```

---

## 실행

```bash
# 1. HWPX → JSON 파싱
pnpm parse-hwpx

# 2. JSON → 청킹 → 임베딩 → DB 삽입
pnpm db:seed
```

> `db:seed`는 기존 `law_chunks` 테이블 전체를 삭제 후 재삽입합니다.

---

## 폴더 구조

```
data/raw/
├── 소득세법.hwpx
├── 소득세법.json                ← parse-hwpx 자동 생성
├── 소득세법_시행령.hwpx
├── 소득세법_시행령.json          ← parse-hwpx 자동 생성
├── 소득세법_시행규칙.hwpx
└── 소득세법_시행규칙.json        ← parse-hwpx 자동 생성
```

---

## 현재 시드 대상 법령

`scripts/seed-laws.ts`의 `FILES` 배열 기준:

| 법령              | 시행일     | incomeTypes |
| ----------------- | ---------- | ----------- |
| 소득세법          | 2026-04-21 | `[]` (공통) |
| 소득세법 시행령   | 2026-04-23 | `[]` (공통) |
| 소득세법 시행규칙 | 2026-04-21 | `[]` (공통) |

`incomeTypes: []`는 소득 유형 무관 공통 법령입니다. 특정 소득 유형 전용 법령은 `['business', 'freelance']` 등으로 지정합니다.

---

## 법령 파일 추가 시

1. `data/raw/`에 `.hwpx` 파일 배치
2. `pnpm parse-hwpx` 실행 → `.json` 자동 생성
3. `scripts/seed-laws.ts`의 `FILES` 배열에 항목 추가

```typescript
{
  path: "data/raw/소득세법_시행규칙.json",
  lawName: "소득세법 시행규칙",
  lawVersion: "2026-04-21",   // 법제처 기준 시행일 (YYYY-MM-DD)
  incomeTypes: [],
},
```

4. `pnpm db:seed` 재실행

---

## HWPX 파일 출처

국가법령정보센터(law.go.kr) → 법령 검색 → 한글(hwpx) 다운로드
