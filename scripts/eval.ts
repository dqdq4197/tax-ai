import "dotenv/config";
import { generateText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { tools } from "../src/server/agent/tools";
import { buildSystemPrompt } from "../src/server/agent/prompts";
import { langfuse } from "../src/server/utils/langfuse";
import { GOLDEN_DATASET, type EvalCase } from "./eval-dataset";

const DATASET_NAME = "tax-ai-golden-set";
const MODEL = "gemini-2.5-flash";
const RUN_NAME = `eval-${new Date().toISOString().slice(0, 16)}`;

type DatasetItemRef = Awaited<
  ReturnType<typeof langfuse.getDataset>
>["items"][number];

// ── 개별 케이스 실행 ─────────────────────────────────────────────────────────

type CaseResult = {
  passed: boolean;
  failures: string[];
  scores: {
    tool_selection: 0 | 1;
    citation_accuracy: 0 | 1 | null; // null = 해당 없음
    content_accuracy: 0 | 1 | null; // null = 해당 없음
  };
  llmResponse: string;
  retrievalEmpty: boolean;
};

async function runCase(
  testCase: EvalCase,
  datasetItem?: DatasetItemRef,
): Promise<CaseResult> {
  const trace = langfuse.trace({
    userId: "tester_heesu",
    name: "eval",
    sessionId: RUN_NAME,
    tags: ["golden-eval"],
    input: { messages: testCase.messages },
    metadata: {
      caseId: testCase.id,
      category: testCase.category,
      description: testCase.description,
    },
  });

  const { steps, text } = await generateText({
    model: google(MODEL),
    system: buildSystemPrompt(),
    messages: testCase.messages,
    tools,
    stopWhen: stepCountIs(6),
  });

  const calledTools = new Set(
    steps.flatMap((s) => s.toolCalls.map((t) => t.toolName)),
  );

  // vector_search 결과가 비어 있는지 확인 (retrieval failure 감지)
  const retrievalEmpty = steps.some((step) =>
    step.toolResults.some(
      (r) =>
        r.toolName === "vector_search" &&
        "output" in r &&
        Array.isArray(r.output) &&
        r.output.length === 0,
    ),
  );

  const failures: string[] = [];

  // ── 도구 호출 여부 체크 ────────────────────────────────────────────────────
  if (
    testCase.expect.toolCalled &&
    !calledTools.has(testCase.expect.toolCalled)
  ) {
    failures.push(
      `expected '${testCase.expect.toolCalled}' to be called but wasn't`,
    );
  }
  if (
    testCase.expect.toolNotCalled &&
    calledTools.has(testCase.expect.toolNotCalled)
  ) {
    failures.push(
      `'${testCase.expect.toolNotCalled}' should NOT have been called`,
    );
  }
  const toolScore: 0 | 1 = failures.length === 0 ? 1 : 0;

  // ── citation accuracy ─────────────────────────────────────────────────────
  // vector_search 또는 law_article_lookup을 호출했을 때 응답에 조항 인용이 있는지 확인
  const citationExpected =
    testCase.expect.toolCalled === "vector_search" ||
    testCase.expect.toolCalled === "law_article_lookup";
  let citationScore: 0 | 1 | null = null;
  if (citationExpected) {
    const citePattern = /제\d+조/;
    citationScore = citePattern.test(text) ? 1 : 0;
    if (citationScore === 0) {
      failures.push(
        "citation missing: response does not cite any law article (제N조)",
      );
    }
  }

  // ── 응답 패턴 체크 (content accuracy) ─────────────────────────────────────
  let contentScore: 0 | 1 | null = null;
  if (testCase.expect.responsePattern) {
    const re = new RegExp(testCase.expect.responsePattern);
    contentScore = re.test(text) ? 1 : 0;
    if (contentScore === 0) {
      failures.push(
        `response does not match pattern: ${testCase.expect.responsePattern}`,
      );
    }
  }

  const passed = failures.length === 0;

  // ── Langfuse 점수 기록 ────────────────────────────────────────────────────
  trace.update({
    output: { text },
    metadata: { toolsUsed: [...calledTools], retrievalEmpty },
  });
  langfuse.score({
    traceId: trace.id,
    name: "tool_selection",
    value: toolScore === 1 ? "통과" : "실패",
    dataType: "CATEGORICAL",
  });
  if (citationScore !== null) {
    langfuse.score({
      traceId: trace.id,
      name: "citation_accuracy",
      value: citationScore === 1 ? "인용있음" : "인용없음",
      dataType: "CATEGORICAL",
    });
  }
  if (contentScore !== null) {
    langfuse.score({
      traceId: trace.id,
      name: "content_accuracy",
      value: contentScore === 1 ? "패턴일치" : "패턴불일치",
      dataType: "CATEGORICAL",
    });
  }
  if (retrievalEmpty) {
    langfuse.score({
      traceId: trace.id,
      name: "retrieval_failure",
      value: "검색없음",
      dataType: "CATEGORICAL",
    });
  }

  // ── Dataset Run Item 연결 ─────────────────────────────────────────────────
  if (datasetItem) {
    await datasetItem.link(trace, RUN_NAME, {
      metadata: { model: MODEL },
    });
  }

  return {
    passed,
    failures,
    scores: {
      tool_selection: toolScore,
      citation_accuracy: citationScore,
      content_accuracy: contentScore,
    },
    llmResponse: text,
    retrievalEmpty,
  };
}

// ── 집계 ──────────────────────────────────────────────────────────────────────

type CategoryStats = { passed: number; total: number };

function printReport(
  results: Array<{ case: EvalCase; result: CaseResult }>,
): void {
  const total = results.length;
  let passedTotal = 0;
  let toolTotal = 0;
  let toolPassed = 0;
  let citationTotal = 0;
  let citationPassed = 0;
  let contentTotal = 0;
  let contentPassed = 0;
  const retrievalFailures: string[] = [];

  const byCategory: Record<string, CategoryStats> = {};

  for (const { case: c, result: r } of results) {
    if (r.passed) passedTotal++;

    const cat = c.category;
    if (!byCategory[cat]) byCategory[cat] = { passed: 0, total: 0 };
    byCategory[cat].total++;
    if (r.passed) byCategory[cat].passed++;

    toolTotal++;
    if (r.scores.tool_selection === 1) toolPassed++;

    if (r.scores.citation_accuracy !== null) {
      citationTotal++;
      if (r.scores.citation_accuracy === 1) citationPassed++;
    }
    if (r.scores.content_accuracy !== null) {
      contentTotal++;
      if (r.scores.content_accuracy === 1) contentPassed++;
    }
    if (r.retrievalEmpty) {
      retrievalFailures.push(c.id);
    }
  }

  const accuracy = pct(passedTotal, total);
  const toolAcc = pct(toolPassed, toolTotal);
  const citationAcc =
    citationTotal > 0 ? pct(citationPassed, citationTotal) : "n/a";
  const contentAcc =
    contentTotal > 0 ? pct(contentPassed, contentTotal) : "n/a";

  console.log(`\n${"═".repeat(65)}`);
  console.log(`전체 정확도 : ${passedTotal}/${total} (${accuracy})`);
  console.log(`도구 선택   : ${toolPassed}/${toolTotal} (${toolAcc})`);
  console.log(
    `인용 정확도 : ${citationPassed}/${citationTotal} (${citationAcc})`,
  );
  console.log(`응답 패턴   : ${contentPassed}/${contentTotal} (${contentAcc})`);
  if (retrievalFailures.length > 0) {
    console.log(`검색 실패   : ${retrievalFailures.join(", ")}`);
  }

  console.log(`\n카테고리별:`);
  for (const [cat, stats] of Object.entries(byCategory)) {
    const bar =
      stats.passed === stats.total ? "✅" : stats.passed === 0 ? "❌" : "⚠️ ";
    console.log(
      `  ${bar} ${cat.padEnd(14)} ${stats.passed}/${stats.total} (${pct(stats.passed, stats.total)})`,
    );
  }
  console.log(`${"═".repeat(65)}`);
  console.log(
    `Langfuse: https://cloud.langfuse.com → Datasets → ${DATASET_NAME} → Runs → ${RUN_NAME}\n`,
  );
}

function pct(n: number, d: number): string {
  return d === 0 ? "n/a" : `${Math.round((n / d) * 100)}%`;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Langfuse Dataset items를 가져와서 id → item 맵 구성
  let itemById: Record<string, DatasetItemRef> = {};
  try {
    const dataset = await langfuse.getDataset(DATASET_NAME);
    itemById = Object.fromEntries(
      dataset.items.map((item) => [item.id ?? "", item]),
    );
    console.log(
      `\n📦 Dataset '${DATASET_NAME}' loaded (${dataset.items.length} items)`,
    );
  } catch {
    console.warn(
      `⚠️  Dataset '${DATASET_NAME}' not found — run seed-langfuse-dataset first.\n   Continuing without dataset run tracking.\n`,
    );
  }

  console.log(
    `\n🧪 Eval run: ${RUN_NAME}  (${GOLDEN_DATASET.length} cases)\n${"─".repeat(65)}`,
  );

  const settled = await Promise.allSettled(
    GOLDEN_DATASET.map(async (c) => {
      const item = itemById[c.id];
      const result = await runCase(c, item);
      return { case: c, result };
    }),
  );

  const results: Array<{ case: EvalCase; result: CaseResult }> = [];

  for (const s of settled) {
    if (s.status === "fulfilled") {
      const { case: c, result: r } = s.value;
      results.push({ case: c, result: r });
      const icon = r.passed ? "✅" : "❌";
      console.log(`${icon} [${c.id}]`);
      for (const f of r.failures) {
        console.log(`     → ${f}`);
      }
      if (!r.passed) {
        console.log(`     LLM: ${r.llmResponse.slice(0, 200)}`);
      }
      if (r.retrievalEmpty) {
        console.log(
          `     ⚠️  retrieval empty (vector_search returned 0 chunks)`,
        );
      }
    } else {
      const c = GOLDEN_DATASET[settled.indexOf(s)];
      console.log(`💥 [${c.id}] ERROR — ${s.reason}`);
    }
  }

  printReport(results);
  await langfuse.flushAsync();
}

main().catch(console.error);
