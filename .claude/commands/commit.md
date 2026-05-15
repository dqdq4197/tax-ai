---
name: commit
description: staged 변경사항을 분석해 Conventional Commits 형식의 커밋 메시지를 작성합니다. 승인 후 커밋합니다.
allowed-tools: Bash
---

# Commit Message Writer

Write a conventional commit message for the currently staged changes.

## Step 1 — Check staged changes

```bash
git diff --staged
git diff --staged --name-only
```

If there are no staged changes, stop and tell the developer. Suggest running `git add <files>` first.

## Step 2 — Check the project's commit style

```bash
git log --oneline -15
```

Note:

- Does the project use Conventional Commits? (`feat:`, `fix:`, `chore:`, etc.)
- Does it include a scope? (`feat(auth):`)
- What's the typical subject line length and tone?

Default to Conventional Commits unless the project clearly uses a different format.

## Step 3 — Write the commit message

**Format:**

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Choose the right type:**
| Type | When to use |
|------|------------|
| `feat` | A new feature or capability |
| `fix` | A bug fix |
| `refactor` | Code restructuring with no behavior change |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Build config, deps, tooling |
| `perf` | Performance improvement |
| `style` | Formatting, whitespace, missing semicolons |
| `ci` | CI/CD configuration |

**Subject line rules:**

- Max 72 characters
- Imperative mood: "add" not "added", "fix" not "fixed"
- No period at the end
- Lowercase after the colon

**Body rules (한국어로 작성):**

- 변경 이유와 맥락을 항목별(`-`)로 나눠서 한국어로 작성
- 코드가 무엇을 하는지가 아니라, 왜 변경했는지를 설명
- 72자 기준으로 줄바꿈
- subject와 빈 줄로 구분

**Footer:**

- Reference issues: `Closes #123`
- Breaking changes: `BREAKING CHANGE: <description>`

## Step 4 — Commit

Show the message to the developer. Once approved:

```bash
# Single-line message:
git commit -m "<type>(<scope>): <subject>"

# With body or footer:
git commit -m "$(cat <<'EOF'
<type>(<scope>): <subject>

<body>

<footer>
EOF
)"
```
