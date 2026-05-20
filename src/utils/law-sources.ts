export const LAW_SOURCES = [
  "소득세법 시행규칙",
  "소득세법 시행령",
  "소득세법",
] as const;

export type LawSource = (typeof LAW_SOURCES)[number];

const sourcePattern = LAW_SOURCES.map((s) => s.replace(/\s+/g, "\\s+")).join(
  "|",
);
export const ARTICLE_REF_RE = new RegExp(
  `(${sourcePattern})\\s+(제\\d+조(?:의\\d+)?)`,
  "g",
);

export function parseArticleRef(article: string): {
  source: LawSource | null;
  articleNum: string;
} {
  const s = article.replace(/\s+/g, " ").trim();
  for (const src of LAW_SOURCES) {
    if (s.startsWith(src + " ")) {
      return { source: src, articleNum: s.slice(src.length + 1) };
    }
  }
  return { source: null, articleNum: s };
}
