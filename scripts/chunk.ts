/**
 * 법령 텍스트를 조(條) 단위로 청킹한다.
 *
 * 전략:
 * 1. 제N조(제목) 패턴으로 1차 분할 — 각 조문을 하나의 청크로 처리
 * 2. 500토큰 초과 시 문장 경계로 2차 분할 (50토큰 overlap)
 * 3. 조 패턴이 없으면 토큰 기반 고정 청킹으로 fallback
 */

export type Chunk = {
  article: string;
  title: string;
  content: string;
  chunkIndex: number;
};

const ARTICLE_PATTERN = /제(\d+)조(?:의\d+)?\s*\(([^)]+)\)/g;
const MAX_TOKENS = 500;
const OVERLAP_TOKENS = 50;

/** 공백 기준 간이 토큰 추정 (한국어 특성상 실제 토큰보다 과소 추정될 수 있음) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 2);
}

function splitByTokens(
  text: string,
  maxTokens: number,
  overlapTokens: number,
): string[] {
  const sentences = text.split(/(?<=[.。\n])\s+/);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (currentTokens + sentenceTokens > maxTokens && current.length > 0) {
      chunks.push(current.join(" "));

      // overlap: 마지막 N토큰 분량의 문장을 다음 청크에 포함
      const overlap: string[] = [];
      let overlapCount = 0;
      for (let i = current.length - 1; i >= 0; i--) {
        overlapCount += estimateTokens(current[i]);
        if (overlapCount > overlapTokens) break;
        overlap.unshift(current[i]);
      }
      current = overlap;
      currentTokens = overlap.reduce((s, t) => s + estimateTokens(t), 0);
    }

    current.push(sentence);
    currentTokens += sentenceTokens;
  }

  if (current.length > 0) {
    chunks.push(current.join(" "));
  }

  return chunks;
}

export function chunkByArticle(text: string): Chunk[] {
  // 제N조 기준 위치 찾기
  const matches: Array<{ index: number; article: string; title: string }> = [];

  let m: RegExpExecArray | null;
  const re = new RegExp(ARTICLE_PATTERN.source, "g");
  while ((m = re.exec(text)) !== null) {
    matches.push({
      index: m.index,
      article: `제${m[1]}조`,
      title: m[2],
    });
  }

  // 조 패턴이 없으면 토큰 기반 fallback
  if (matches.length === 0) {
    return splitByTokens(text, MAX_TOKENS, OVERLAP_TOKENS).map(
      (content, i) => ({
        article: `chunk-${i + 1}`,
        title: "",
        content: content.trim(),
        chunkIndex: i,
      }),
    );
  }

  const articles: Array<{ article: string; title: string; content: string }> =
    [];

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    articles.push({
      article: matches[i].article,
      title: matches[i].title,
      content: text.slice(start, end).trim(),
    });
  }

  // 500토큰 초과 시 2차 분할
  const result: Chunk[] = [];
  let globalIndex = 0;

  for (const art of articles) {
    if (estimateTokens(art.content) <= MAX_TOKENS) {
      result.push({ ...art, chunkIndex: globalIndex++ });
    } else {
      const subChunks = splitByTokens(art.content, MAX_TOKENS, OVERLAP_TOKENS);
      for (const sub of subChunks) {
        result.push({
          article: art.article,
          title: art.title,
          content: sub.trim(),
          chunkIndex: globalIndex++,
        });
      }
    }
  }

  return result;
}
