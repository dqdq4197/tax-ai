import type { OnFinishEvent, ToolSet } from "ai";
import { langfuse } from ".";

export function scoreChatTrace<T extends ToolSet>(
  traceId: string,
  event: OnFinishEvent<T>,
  stepLimit: number,
) {
  const allToolCalls = event.steps.flatMap((s) => s.toolCalls);
  const allToolResults = event.steps.flatMap((s) => s.toolResults);
  const toolsUsed = new Set(allToolCalls.map((tc) => tc.toolName));

  // 주요 목적 분류 (우선순위: 계산 > 조문조회 > 상담 > 도구없음)
  const intent = toolsUsed.has("tax_calculator")
    ? "계산"
    : toolsUsed.has("law_article_lookup")
      ? "조문조회"
      : toolsUsed.has("vector_search")
        ? "상담"
        : "도구없음";

  langfuse.score({
    traceId,
    name: "intent",
    value: intent,
    dataType: "CATEGORICAL",
    comment:
      "호출된 tool 기준으로 분류. 도구없음은 LLM이 tool을 사용하지 않은 비정상 케이스",
  });

  // tax_calculator: 호출 수 대비 결과 수로 오류 횟수 산출
  const calcCalls = allToolCalls.filter(
    (tc) => tc.toolName === "tax_calculator",
  ).length;
  const calcSuccess = allToolResults.filter(
    (r) => r.toolName === "tax_calculator",
  ).length;
  const calcErrors = calcCalls - calcSuccess;

  if (calcCalls > 0) {
    langfuse.score({
      traceId,
      name: "calculator_success",
      value:
        calcErrors > 0 && calcSuccess === 0
          ? "실패"
          : calcErrors > 0
            ? "재시도후성공"
            : "바로성공",
      dataType: "CATEGORICAL",
      comment:
        "tool 호출 수 대비 결과 수로 판단. 재시도후성공은 검증 실패 후 LLM이 파라미터를 수정한 케이스",
    });
  }

  const searchResults = allToolResults.filter(
    (r) => r.toolName === "vector_search",
  );
  if (searchResults.length > 0) {
    const emptyCount = searchResults.filter(
      (r) => "output" in r && Array.isArray(r.output) && r.output.length === 0,
    ).length;
    const retrievalScore =
      emptyCount === 0 ? 1 : emptyCount === searchResults.length ? 0 : 0.5;
    langfuse.score({
      traceId,
      name: "retrieval_result",
      value: retrievalScore,
      dataType: "NUMERIC",
      comment:
        "1 = 전부 성공, 0.5 = 일부 빈 결과, 0 = 전부 빈 결과(법령 미인덱싱 또는 쿼리 불일치)",
    });
  }

  // law_article_lookup: 조항 원문 반환 성공 여부
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
    langfuse.score({
      traceId,
      name: "law_lookup_result",
      value: notFound ? 0 : 1,
      dataType: "NUMERIC",
      comment: "0 = 조항 미발견, 1 = 원문 반환 성공",
    });
  }

  langfuse.score({
    traceId,
    name: "completed_within_steps",
    value: event.steps.length < stepLimit ? 1 : 0,
    dataType: "NUMERIC",
    comment: `1 = stepLimit(${stepLimit}) 내 완료, 0 = 한도 초과`,
  });

  langfuse.score({
    traceId,
    name: "step_count",
    value: event.steps.length,
    dataType: "NUMERIC",
    comment: "실제 step 수. 평균 추이로 응답 복잡도 모니터링",
  });

  // stop / tool-calls 이외는 비정상 종료 — 콘텐츠 필터·오류 등 감지
  if (event.finishReason !== "stop" && event.finishReason !== "tool-calls") {
    langfuse.score({
      traceId,
      name: "finish_reason",
      value: event.finishReason,
      dataType: "CATEGORICAL",
      comment: "비정상 종료 감지용. stop/tool-calls 정상 케이스는 기록 생략",
    });
  }
}
