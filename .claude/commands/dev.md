---
name: dev
description: 5-agent 개발 워크플로우 (Planner→Explorer→Executor→Reviewer→Reflector). 요구사항을 받아 최소 변경으로 구현하고 검증까지 완료한다. 실패 시 Reflector가 근본 원인을 분석해 Executor에 전달한다.
allowed-tools: Agent, TodoWrite, Bash, Read
---

# Dev Workflow Orchestrator

요구사항: **$ARGUMENTS**

---

## Phase 0 — 작업 트래킹 초기화

TodoWrite로 5개 항목을 생성한다:
- Planner: 요구사항 분석 및 TaskPlan 생성
- Explorer: 코드베이스 탐색 및 CodeMap 생성
- Executor: 최소 변경 구현
- Reviewer: build / type-check / lint / test 검증
- Reflector: 실패 근본 원인 분석 (실패 시에만 활성화)

---

## Phase 1 — Planner

Agent 도구를 사용해 **subagent_type: "Plan"** 으로 다음 프롬프트를 실행한다.

```
You are the Planner agent for a tax AI chatbot (Next.js 15, TypeScript, Vercel AI SDK, Drizzle ORM, PostgreSQL+pgvector).
Working directory: /Users/heesu/myspace/tax-ai

User requirement: $ARGUMENTS

Analyze the requirement and output a TaskPlan as a single JSON code block.

TaskPlan schema:
{
  "goal": "한 줄 목표",
  "scope": {
    "in":  ["변경 허용 경로"],
    "out": ["변경 금지 경로 — 이유 포함"]
  },
  "tasks": [
    { "id": "T1", "description": "설명", "depends_on": [] }
  ],
  "constraints": ["최소 변경", "기존 패턴 유지"],
  "risks": ["위험 요소"],
  "explorer_hints": ["찾아야 할 파일·심볼·패턴"]
}

Rules:
- scope.out은 최대한 구체적으로 — 모르면 보수적으로 넣는다.
- tasks는 관심사 하나 = task 하나로 분해한다.
- HOW가 아닌 WHAT만 정의한다. 구현하거나 파일을 수정하지 않는다.
- JSON 코드 블록 하나만 출력한다.
```

결과에서 ```json 블록을 추출해 **TASK_PLAN** 변수에 저장한다.
Planner todo를 완료로 표시한다.

---

## Phase 2 — Explorer

Agent 도구를 사용해 **subagent_type: "Explore"** 로 다음 프롬프트를 실행한다.
TASK_PLAN 전체를 인라인으로 삽입한다.

```
You are the Explorer agent. Map the codebase based on this TaskPlan.
Working directory: /Users/heesu/myspace/tax-ai
Do NOT modify any file.

TaskPlan:
[INSERT TASK_PLAN]

Use grep/find to locate symbols, then Read to verify file content.
Produce a CodeMap as a single JSON code block.

CodeMap schema:
{
  "files_to_modify": [
    { "path": "src/...", "reason": "왜 수정하는가", "key_symbols": ["함수·타입명"], "line_range": "N-M" }
  ],
  "files_to_create": [
    { "path": "src/...", "reason": "왜 새로 만드는가" }
  ],
  "patterns": {
    "naming": "발견된 파일·변수 네이밍 규칙",
    "imports": "import 스타일",
    "style": "컴포넌트·함수 패턴"
  },
  "dependencies": ["이 변경에 영향받는 downstream 파일"],
  "do_not_touch": ["경로 — 이유"]
}

Rules:
- Read하지 않은 파일은 files_to_modify에 포함하지 않는다.
- 관련 없는 파일은 포함하지 않는다.
- 패턴은 추측이 아닌 관찰한 사실만 기록한다.
- JSON 코드 블록 하나만 출력한다.
```

결과에서 ```json 블록을 추출해 **CODE_MAP** 변수에 저장한다.
Explorer todo를 완료로 표시한다.

---

## Phase 3 — Executor → Reviewer → Reflector 루프

**RETRY_COUNT = 0**, **REFLECTION = null** 로 초기화한다.

아래 루프를 최대 3회 반복한다:

### 3a. Executor

Agent 도구를 사용해 **subagent_type: "claude"** 로 다음 프롬프트를 실행한다.
TASK_PLAN, CODE_MAP, REFLECTION(있으면)을 인라인으로 삽입한다.

```
You are the Executor agent. Implement the minimum changes to satisfy the TaskPlan.
Working directory: /Users/heesu/myspace/tax-ai

TaskPlan:
[INSERT TASK_PLAN]

CodeMap:
[INSERT CODE_MAP]

[IF RETRY:]
Reflector analysis — follow this exactly:
[INSERT REFLECTION]
[END IF]

Code conventions:
- Files: kebab-case, Components: PascalCase, Functions/vars: camelCase
- Imports: use @/ absolute paths
- No explanatory comments — only WHY-comments for non-obvious constraints
- No new abstractions beyond what the task requires

Rules:
1. Only modify files in CodeMap.files_to_modify.
2. Only create files in CodeMap.files_to_create.
3. Match CodeMap.patterns exactly.
4. Do NOT run build/lint/test.
5. If retrying: apply only what Reflection.specific_fixes instructs. Nothing else.

When done, output a Diff summary as a JSON code block:
{
  "changed_files": ["경로"],
  "created_files": ["경로"],
  "deleted_files": [],
  "summary": "변경 내용 한 줄 요약"
}
```

결과에서 Diff JSON을 추출해 **DIFF** 변수에 저장한다.
Executor todo를 진행중으로 표시한다.

### 3b. Reviewer

Agent 도구를 사용해 **subagent_type: "claude"** 로 다음 프롬프트를 실행한다.

```
You are the Reviewer agent. Validate the implementation by running checks.
Working directory: /Users/heesu/myspace/tax-ai

Changed files:
[INSERT DIFF]

Allowed to be modified (scope check):
[INSERT CODE_MAP.files_to_modify + files_to_create]

Run these checks in order — run ALL even if one fails:
1. pnpm type-check
2. pnpm lint
3. pnpm build
4. pnpm test (only if test files exist in changed_files)

Then verify no file outside the allowed list was modified:
  git diff --name-only HEAD

Output a ReviewReport as a JSON code block:
{
  "status": "pass" | "fail" | "critical",
  "passed_checks": ["type-check", ...],
  "failed_checks": [
    {
      "check": "type-check",
      "error": "에러 원문 (터미널 출력 그대로)",
      "file": "src/...",
      "line": 0,
      "fix_hint": "방향 힌트 — 코드 작성 금지"
    }
  ],
  "scope_violation": ["허용 범위 밖에서 변경된 파일"]
}

Rules:
- Do NOT modify any file.
- fix_hint는 방향만, 코드를 직접 작성하지 않는다.
- scope_violation이 있으면 status를 "critical"로 설정한다.
```

결과에서 ReviewReport JSON을 추출해 **REVIEW_REPORT** 변수에 저장한다.

### 3c. Reflector (status == "fail" 일 때만 실행)

Reviewer가 "fail"을 반환한 경우, Executor로 바로 넘기지 않고 Reflector를 먼저 실행한다.
Reflector todo를 진행중으로 표시한다.

Agent 도구를 사용해 **subagent_type: "claude"** 로 다음 프롬프트를 실행한다.
TASK_PLAN, CODE_MAP, DIFF, REVIEW_REPORT를 인라인으로 삽입한다.

```
You are the Reflector agent. Analyze WHY the implementation failed and produce a precise fix plan.
Working directory: /Users/heesu/myspace/tax-ai
Do NOT modify any file.

TaskPlan:
[INSERT TASK_PLAN]

CodeMap:
[INSERT CODE_MAP]

What Executor implemented:
[INSERT DIFF]

What Reviewer found:
[INSERT REVIEW_REPORT]

Your job:
1. Identify the ROOT CAUSE — not just the symptom reported by Reviewer.
2. Identify the FAILED APPROACH — what assumption or decision led Executor astray.
3. Specify the CORRECT APPROACH — the exact strategy that avoids the root cause.
4. List SPECIFIC FIXES — file, line, and what to change. Be surgical.
5. List DO_NOT_REPEAT patterns — so Executor doesn't make the same class of mistake.

Output a Reflection as a single JSON code block:
{
  "root_cause": "근본 원인 (에러 메시지 반복 금지 — 왜 그 에러가 발생했는가)",
  "failed_approach": "Executor가 택한 잘못된 접근 또는 가정",
  "correct_approach": "올바른 전략 (구체적으로)",
  "specific_fixes": [
    {
      "file": "src/...",
      "line": 0,
      "action": "정확히 무엇을 어떻게 바꿔야 하는가"
    }
  ],
  "do_not_repeat": ["이번 실패에서 도출된 금지 패턴 — 다음 Executor가 반드시 피해야 할 것"]
}
```

결과에서 Reflection JSON을 추출해 **REFLECTION** 변수에 저장한다.
Reflector todo를 완료로 표시한다.

### 3d. 결과 분기

- **status == "pass"**: Reviewer todo 완료로 표시 → 아래 성공 출력 후 루프 종료
- **status == "fail" && RETRY_COUNT < 2**: RETRY_COUNT += 1, Executor todo를 미완료로 표시, **3c에서 생성한 REFLECTION을 3a에 전달** → 루프 재시작
- **status == "critical" || RETRY_COUNT >= 2**: 아래 에스컬레이션 출력 후 루프 종료

---

## 성공 출력

```
✓ Dev workflow 완료

목표: [TASK_PLAN.goal]
변경: [DIFF.changed_files]
통과: [REVIEW_REPORT.passed_checks]

[DIFF.summary]
```

## 에스컬레이션 출력 (사람 개입 필요)

```
⚠ 자동 해결 불가 — 개입이 필요합니다

실패 원인:
[REVIEW_REPORT.failed_checks 전체]

재시도 횟수: [RETRY_COUNT]

다음 중 하나를 선택해 주세요:
1. 요구사항을 수정하고 /dev 재실행
2. /execute 로 Executor만 단독 실행해 수동 수정
3. /review 로 현재 상태 재검증
```
