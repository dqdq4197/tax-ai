# 세법 데이터

HWPX 파일을 파싱해 JSON으로 변환한 뒤 `pnpm db:seed`를 실행하면 pgvector DB에 삽입됩니다.

## 파이프라인

```
data/raw/*.hwpx  →  pnpm parse-hwpx  →  data/raw/*.json  →  pnpm db:seed  →  pgvector DB
```

## 폴더 구조

```
data/raw/
├── 소득세법.hwpx
├── 소득세법.json           ← parse-hwpx 자동 생성
├── 소득세법_시행령.hwpx
├── 소득세법_시행령.json     ← parse-hwpx 자동 생성
├── 소득세법_시행규칙.hwpx
└── 소득세법_시행규칙.json   ← parse-hwpx 자동 생성
```

## 사용 방법

```bash
# 1. HWPX → JSON 파싱
pnpm parse-hwpx

# 2. JSON → pgvector 삽입 (임베딩 포함)
pnpm db:seed
```

## 파일 추가 시

1. `data/raw/` 에 `.hwpx` 파일 배치
2. `pnpm parse-hwpx` 실행
3. `scripts/seed-laws.ts`의 `FILES` 배열에 항목 추가
   - `path`: JSON 파일 경로
   - `lawVersion`: 법령 시행일 (YYYY-MM-DD, 법제처 기준)
   - `incomeTypes`: `[]` (공통) 또는 `['business', 'freelance']` 등

## HWPX 파일 출처

국가법령정보센터(law.go.kr) → 해당 법령 검색 → 한글(hwpx) 다운로드
