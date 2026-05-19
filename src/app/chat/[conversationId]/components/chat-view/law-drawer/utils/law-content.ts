const HANG_CHARS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
const HANG_SPLIT_RE = new RegExp(`([${HANG_CHARS}])`);
const AMENDMENT_SPLIT_RE = /(<(?:개정|신설|삭제)[^>]*>)/g;
const ARTICLE_HEADER_RE = /^제\d+조(?:의\d+)?\([^)]*\)\s*/m;

export interface Segment {
  type: "text" | "amendment" | "item";
  value: string;
  num?: number;
}

interface Section {
  marker?: string;
  segments: Segment[];
}

function buildSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  const amendParts = text.split(AMENDMENT_SPLIT_RE);

  for (let i = 0; i < amendParts.length; i++) {
    if (i % 2 === 1) {
      segments.push({ type: "amendment", value: amendParts[i] });
      continue;
    }

    const chunk = amendParts[i];
    const itemParts = chunk.split(/\s+(\d{1,2})\.\s+/);

    if (itemParts[0]?.trim()) {
      segments.push({ type: "text", value: itemParts[0].trim() });
    }
    for (let j = 1; j < itemParts.length; j += 2) {
      const itemText = itemParts[j + 1]?.trim();
      if (itemText) {
        segments.push({
          type: "item",
          num: parseInt(itemParts[j]),
          value: itemText,
        });
      }
    }
  }

  return segments;
}

export function parseLawContent(content: string): Section[] {
  const body = content
    .replace(ARTICLE_HEADER_RE, "")
    .replace(/\n\s+/g, " ")
    .trim();
  const parts = body.split(HANG_SPLIT_RE);
  const sections: Section[] = [];

  if (parts[0]?.trim()) {
    sections.push({ segments: buildSegments(parts[0].trim()) });
  }
  for (let i = 1; i < parts.length; i += 2) {
    sections.push({
      marker: parts[i],
      segments: buildSegments(parts[i + 1]?.trim() ?? ""),
    });
  }
  return sections;
}
