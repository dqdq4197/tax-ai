---
name: write-tests
description: vitest 기반 유닛 테스트를 작성한다. 테스트 작성, 테스트 추가, 커버리지 개선이 필요할 때 사용.
---

# Write Tests

`$ARGUMENTS`에 대한 vitest 유닛 테스트를 작성한다.

## 테스트 파일 위치

테스트 파일은 **테스트 대상 파일과 같은 디렉터리**에 위치시킨다.

```
src/remotes/campaigns/api.ts       ← 대상
src/remotes/campaigns/api.test.ts  ← 테스트 (같은 위치)
```

## 순서

1. 대상 파일을 읽고 public interface(함수, 타입, 에러 조건)를 파악한다
2. 같은 디렉터리에 `<filename>.test.ts` 파일이 있으면 읽어서 기존 테스트를 파악한다
3. 테스트 케이스를 설계한다
   - 정상 흐름 (happy path)
   - 경계값 (boundary)
   - 에러 조건 (error cases)
4. 테스트를 작성한다
5. `pnpm test run <testfile>` 로 실행해서 통과를 확인한다

## 컨벤션

- 테스트명은 한국어 또는 영어 모두 허용, **행위 중심**으로 작성: `"유효하지 않은 status면 필터링된다"`
- 구조: **Arrange → Act → Assert** 순서로 작성
- 테스트 하나에 개념 하나
- `describe` 블록으로 관련 테스트를 그룹화한다
- `vi.fn()` / `vi.spyOn()` 으로 외부 의존성(fetch, DB 등)을 mock한다
- `beforeEach` / `afterEach` 로 mock을 초기화한다

## fetch mock 패턴

`mockFetch`는 `src/remotes/core/test-utils.ts`에 정의되어 있다. 직접 정의하지 말고 import해서 사용한다.

```typescript
import { mockFetch, mockFetchNetworkError } from "../core/test-utils";

// 정상 응답
mockFetch({ data: [...] });

// HTTP 에러
mockFetch(null, false, 500);

// 네트워크 에러
mockFetchNetworkError();
```

## vitest 실행 명령

```bash
# 단일 파일
pnpm test run src/remotes/campaigns/api.test.ts

# watch 모드
pnpm test src/remotes/campaigns/api.test.ts
```
