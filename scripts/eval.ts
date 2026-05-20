import "dotenv/config";
import { generateText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { tools } from "../src/server/agent/tools";
import { buildSystemPrompt } from "../src/server/agent/prompts";
import { langfuse } from "../src/server/utils/langfuse";
import { GOLDEN_DATASET, type EvalCase } from "./eval-dataset";

const MODEL = "gemini-2.5-flash";
const RUN_NAME = `eval-${new Date().toISOString().slice(0, 16)}`;

async function runCase(testCase: EvalCase): Promise<{ passed: boolean; score: number; reason: string; llmResponse: string }> {
  const trace = langfuse.trace({
    name: "eval",
    sessionId: RUN_NAME,
    tags: ["golden-eval"],
    input: { messages: testCase.messages },
    metadata: { caseId: testCase.id, description: testCase.description },
  });

  const { steps, text } = await generateText({
    model: google(MODEL),
    system: buildSystemPrompt(),
    messages: testCase.messages,
    tools,
    stopWhen: stepCountIs(10),
  });

  const calledTools = new Set(steps.flatMap((s) => s.toolCalls.map((t) => t.toolName)));

  let passed = true;
  let reason = "OK";

  if (testCase.expect.toolCalled && !calledTools.has(testCase.expect.toolCalled)) {
    passed = false;
    reason = `expected ${testCase.expect.toolCalled} to be called, but wasn't`;
  }
  if (testCase.expect.toolNotCalled && calledTools.has(testCase.expect.toolNotCalled)) {
    passed = false;
    reason = `${testCase.expect.toolNotCalled} should NOT have been called`;
  }

  const score = passed ? 1 : 0;

  trace.update({ output: { text }, metadata: { toolsUsed: [...calledTools] } });
  langfuse.score({ traceId: trace.id, name: "correct_tool_selection", value: score });

  return { passed, score, reason, llmResponse: text };
}

async function main() {
  console.log(`\n🧪 Eval run: ${RUN_NAME}\n${"─".repeat(60)}`);

  const results = await Promise.allSettled(
    GOLDEN_DATASET.map((c) => runCase(c)),
  );

  let passed = 0;
  results.forEach((r, i) => {
    const c = GOLDEN_DATASET[i];
    if (r.status === "fulfilled") {
      const { passed: ok, reason, llmResponse } = r.value;
      const icon = ok ? "✅" : "❌";
      console.log(`${icon} [${c.id}] ${ok ? "PASS" : `FAIL — ${reason}`}`);
      if (!ok) console.log(`   LLM: ${llmResponse.slice(0, 200)}`);
      if (ok) passed++;
    } else {
      console.log(`💥 [${c.id}] ERROR — ${r.reason}`);
    }
  });

  const total = GOLDEN_DATASET.length;
  const accuracy = Math.round((passed / total) * 100);
  console.log(`\n${"─".repeat(60)}`);
  console.log(`정확도: ${passed}/${total} (${accuracy}%)  |  run: ${RUN_NAME}`);
  console.log(`Langfuse: https://cloud.langfuse.com → Sessions → ${RUN_NAME}\n`);

  await langfuse.flushAsync();
}

main().catch(console.error);
