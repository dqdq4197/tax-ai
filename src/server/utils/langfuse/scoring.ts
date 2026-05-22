import type { OnFinishEvent, ToolSet } from "ai";
import type { LangfuseTraceClient } from "langfuse";

export function scoreChatTrace<T extends ToolSet>(
  trace: LangfuseTraceClient,
  event: OnFinishEvent<T>,
  stepLimit: number,
) {
  const allToolNames = event.steps.flatMap((s) =>
    s.toolCalls.map((t) => t.toolName),
  );
  const allToolResults = event.steps.flatMap((s) => s.toolResults);
  const allToolErrors = event.steps
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === "tool-error");

  const toolsUsed = new Set(allToolNames);

  // intent
  const intent = toolsUsed.has("tax_calculator")
    ? "계산"
    : toolsUsed.has("law_article_lookup")
      ? "조문조회"
      : toolsUsed.has("vector_search")
        ? "상담"
        : "도구없음";

  trace.score({ name: "intent", value: intent, dataType: "CATEGORICAL" });

  // tax_calculator 성공 여부
  const calcErrors = allToolErrors.filter(
    (c) => "toolName" in c && c.toolName === "tax_calculator",
  ).length;
  const calcSuccess = allToolResults.filter(
    (r) => r.toolName === "tax_calculator",
  ).length;

  if (calcSuccess + calcErrors > 0) {
    const calcValue =
      calcErrors > 0 && calcSuccess === 0
        ? "실패"
        : calcErrors > 0
          ? "재시도후성공"
          : "바로성공";
    trace.score({
      name: "calculator_success",
      value: calcValue,
      dataType: "CATEGORICAL",
    });
  }

  // vector_search 검색 결과 여부
  const searchResults = allToolResults.filter(
    (r) => r.toolName === "vector_search",
  );
  if (searchResults.length > 0) {
    const isEmpty = searchResults.every(
      (r) => "output" in r && Array.isArray(r.output) && r.output.length === 0,
    );
    trace.score({
      name: "retrieval_result",
      value: isEmpty ? "실패" : "성공",
      dataType: "CATEGORICAL",
    });
  }

  // law_article_lookup 결과 여부
  const lookupResults = allToolResults.filter(
    (r) => r.toolName === "law_article_lookup",
  );
  if (lookupResults.length > 0) {
    const notFound = lookupResults.some(
      (result) =>
        "output" in result &&
        typeof result.output === "object" &&
        result.output !== null &&
        "found" in result.output &&
        (result.output as { found: boolean }).found === false,
    );
    trace.score({
      name: "law_lookup_result",
      value: notFound ? "실패" : "성공",
      dataType: "CATEGORICAL",
    });
  }

  // max_steps 도달 여부 + 실제 step 수
  trace.score({
    name: "max_steps_hit",
    value: event.steps.length >= stepLimit ? "실패" : "성공",
    dataType: "CATEGORICAL",
  });
  trace.score({
    name: "step_count",
    value: event.steps.length,
    dataType: "NUMERIC",
  });
}
