/**
 * ParsedLaw JSON(parse-hwpx.ts 출력)을 RAG 최적화 청크로 변환한다.
 *
 * 청킹 전략:
 * - 기본 단위: ARTICLE(조) — 900 tokens 이하면 단일 청크
 * - 900 tokens 초과: PARAGRAPH(①②...) 단위로 분할 + 이전 항 overlap
 * - PARAGRAPH도 1200 tokens 초과: 줄 단위 분할(최후 수단)
 */

// ─── 입력 타입 (parse-hwpx.ts 출력 구조) ──────────────────────────────────────

interface ParsedParagraph {
  paragraph: string;
  text: string;
}

interface ParsedArticle {
  article: string;
  content: string;
  paragraphs: ParsedParagraph[];
}

interface ParsedSection {
  section: string | null;
  articles: ParsedArticle[];
}

interface ParsedChapter {
  chapter: string | null;
  sections: ParsedSection[];
}

export interface ParsedLaw {
  law_name: string;
  structure: { chapters: ParsedChapter[] };
}

// ─── 출력 타입 ────────────────────────────────────────────────────────────────

export type ChunkType =
  | "definition"
  | "rule"
  | "exception"
  | "procedure"
  | "mixed";

export interface ChunkMetadata {
  source: string;
  article: string;
  title: string;
  lawVersion: string;
  incomeTypes: string[];
  paragraph: string;
  chunk_type: ChunkType;
  parent_article: string;
  references: string[];
  keywords: string[];
  token_estimate: number;
  order_index: number;
  chapter: string | null;
  section: string | null;
}

export interface LawChunk {
  chunk_id: string;
  text: string;
  metadata: ChunkMetadata;
}

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const TOKEN_ARTICLE_MAX = 900;
const TOKEN_CHUNK_MAX = 1200;
const TOKEN_CHUNK_MIN = 50;

const PARA_MARKS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";

// ─── 토큰 추정 ────────────────────────────────────────────────────────────────

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 2);
}

// ─── 청크 타입 분류 ───────────────────────────────────────────────────────────

function classifyChunkType(text: string): ChunkType {
  const isDef = /이란\s|이라\s함은|이라\s한다/.test(text);
  const isExc = /다만[,\s]|에도\s불구하고|제외한다|제외하고|아니한다/.test(
    text,
  );
  const isProc = /신청|제출|통보|통지|절차|기한\s내|기간\s내/.test(text);

  const n = [isDef, isExc, isProc].filter(Boolean).length;
  if (n > 1) return "mixed";
  if (isDef) return "definition";
  if (isExc) return "exception";
  if (isProc) return "procedure";
  return "rule";
}

// ─── 레퍼런스 추출 ────────────────────────────────────────────────────────────

function extractReferences(text: string, selfRef?: string): string[] {
  const refs = new Set<string>();
  const re = /제\d+조(?:의\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0] !== selfRef) refs.add(m[0]);
  }
  return Array.from(refs);
}

// ─── 키워드 추출 ─────────────────────────────────────────────────────────────

const LEGAL_TERMS = [
  "소득",
  "세율",
  "세액",
  "공제",
  "납세",
  "납부",
  "신고",
  "과세",
  "결정",
  "환급",
  "부과",
  "원천징수",
  "종합소득",
  "사업소득",
  "근로소득",
  "이자소득",
  "배당소득",
  "연금소득",
  "기타소득",
  "양도소득",
  "퇴직소득",
  "필요경비",
  "기준경비율",
  "단순경비율",
  "인적공제",
  "기본공제",
  "추가공제",
  "거주자",
  "비거주자",
  "내국법인",
  "외국법인",
  "결손금",
  "이월결손금",
  "총수입금액",
  "분리과세",
  "종합합산",
  "장부",
];

function extractKeywords(text: string, title: string): string[] {
  const kw = new Set<string>();

  // 조문 제목 단어
  title
    .split(/[\s,·\/]+/)
    .filter((w) => w.length >= 2)
    .forEach((w) => kw.add(w));

  // 핵심 법률 용어 매칭
  LEGAL_TERMS.forEach((t) => {
    if (text.includes(t)) kw.add(t);
  });

  // 2회 이상 등장하는 한국어 단어
  const counts = new Map<string, number>();
  const re = /[가-힣]{2,6}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    counts.set(m[0], (counts.get(m[0]) ?? 0) + 1);
  }
  for (const [w, cnt] of counts) {
    if (cnt >= 2) kw.add(w);
  }

  return Array.from(kw).slice(0, 15);
}

// ─── 문단 분할 ────────────────────────────────────────────────────────────────

/**
 * content를 ①②... 기준으로 분할한다.
 * header = ①이전 텍스트(조문 라벨 등), segments = 각 항 텍스트 배열
 */
function splitByParaMarks(content: string): {
  header: string;
  segments: string[];
} {
  const firstPos = Math.min(
    ...Array.from(PARA_MARKS).map((m) => {
      const i = content.indexOf(m);
      return i >= 0 ? i : Infinity;
    }),
  );

  if (!isFinite(firstPos)) {
    return { header: content.split("\n")[0], segments: [] };
  }

  const header = content.slice(0, firstPos).trim();
  const rest = content.slice(firstPos);

  // ①②... 앞에서 분리 (lookahead)
  const segments = rest
    .split(/(?=[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])/)
    .map((s) => s.trim())
    .filter(Boolean);

  return { header, segments };
}

/** 줄 단위로 청킹 (최후 수단 — 토큰 초과 시) */
function splitByLines(text: string, maxTokens: number): string[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const chunks: string[] = [];
  let current: string[] = [];
  let cur = 0;

  for (const line of lines) {
    const lt = estimateTokens(line);
    if (cur + lt > maxTokens && current.length > 0) {
      chunks.push(current.join("\n"));
      current = [];
      cur = 0;
    }
    current.push(line);
    cur += lt;
  }
  if (current.length > 0) chunks.push(current.join("\n"));
  return chunks;
}

// ─── ID 생성 ──────────────────────────────────────────────────────────────────

function makeId(...parts: string[]): string {
  return parts
    .join("_")
    .replace(/[^\w가-힣]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60);
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

export function chunkParsedLaw(
  parsedLaw: ParsedLaw,
  lawVersion = "",
  incomeTypes: string[] = [],
): LawChunk[] {
  const { law_name, structure } = parsedLaw;
  const chunks: LawChunk[] = [];
  let orderIndex = 0;

  function build(
    text: string,
    article: ParsedArticle,
    paragraph: string,
    chapterLabel: string | null,
    sectionLabel: string | null,
    suffix: string,
  ): LawChunk | null {
    const tokens = estimateTokens(text);
    if (tokens < TOKEN_CHUNK_MIN) return null;

    const articleTitle = article.article.match(/\(([^)]+)\)/)?.[1] ?? "";
    const selfRef = article.article.match(/제\d+조(?:의\d+)?/)?.[0];

    return {
      chunk_id: makeId(law_name, article.article, suffix),
      text,
      metadata: {
        source: law_name,
        article: article.article,
        title: articleTitle,
        lawVersion,
        incomeTypes,
        paragraph,
        chunk_type: classifyChunkType(text),
        parent_article: article.article,
        references: extractReferences(text, selfRef),
        keywords: extractKeywords(text, articleTitle),
        token_estimate: tokens,
        order_index: orderIndex++,
        chapter: chapterLabel,
        section: sectionLabel,
      },
    };
  }

  for (const chapter of structure.chapters) {
    for (const section of chapter.sections) {
      for (const article of section.articles) {
        const articleTokens = estimateTokens(article.content);
        const ch = chapter.chapter;
        const sec = section.section;

        if (articleTokens <= TOKEN_ARTICLE_MAX) {
          // CASE 1: 단일 청크
          const chunk = build(article.content, article, "", ch, sec, "0");
          if (chunk) chunks.push(chunk);
        } else {
          const { header, segments } = splitByParaMarks(article.content);

          if (segments.length > 1) {
            // CASE 2: PARAGRAPH 단위 분할 (이전 항 overlap)
            for (let i = 0; i < segments.length; i++) {
              const prev = i > 0 ? segments[i - 1] : null;
              const paraText = [header, prev, segments[i]]
                .filter(Boolean)
                .join("\n");
              const mark = segments[i][0] ?? "";

              if (estimateTokens(paraText) > TOKEN_CHUNK_MAX) {
                // CASE 3: 줄 단위 분할
                splitByLines(paraText, TOKEN_CHUNK_MAX).forEach((sub, j) => {
                  const c = build(sub, article, mark, ch, sec, `${i}_${j}`);
                  if (c) chunks.push(c);
                });
              } else {
                const c = build(paraText, article, mark, ch, sec, `${i}`);
                if (c) chunks.push(c);
              }
            }
          } else {
            // CASE 3: 문단 기호 없음 — 줄 단위 분할
            splitByLines(article.content, TOKEN_ARTICLE_MAX).forEach(
              (sub, j) => {
                const c = build(sub, article, "", ch, sec, `${j}`);
                if (c) chunks.push(c);
              },
            );
          }
        }
      }
    }
  }

  return chunks;
}
