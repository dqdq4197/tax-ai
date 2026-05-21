/**
 * HWPX 법률 문서를 파싱해 구조화된 JSON으로 변환하는 스크립트.
 * 실행: pnpm parse-hwpx
 *
 * data/raw/**\/*.hwpx 파일을 재귀 탐색하여
 * 같은 위치에 동일한 파일명의 .json 을 생성한다.
 */

import { writeFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, extname, basename } from "path";
import AdmZip from "adm-zip";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Paragraph {
  paragraph: string;
  text: string;
}

interface Article {
  article: string;
  content: string;
  paragraphs: Paragraph[];
}

interface Section {
  section: string | null;
  articles: Article[];
}

interface Chapter {
  chapter: string | null;
  sections: Section[];
}

interface ParsedLaw {
  law_name: string;
  structure: {
    chapters: Chapter[];
  };
}

// ─── XML Text Extraction ──────────────────────────────────────────────────────

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    );
}

/**
 * HWPX 섹션 XML에서 단락 단위 텍스트 배열을 추출한다.
 *
 * HWPX 구조: <hp:p> 내에 <hp:tbl> 이 중첩될 수 있으므로
 * <hp:p 태그 기준으로 분할 후 직계 <hp:t> 텍스트만 수집한다.
 * 테이블 셀 내부 단락은 별도 세그먼트로 자연스럽게 처리된다.
 */
function extractParagraphsFromXml(xml: string): string[] {
  // hp: / hh: 두 네임스페이스를 모두 처리
  const segments = xml.split(/<(?:hp|hh):p(?:\s[^>]*)?>/);
  const lines: string[] = [];

  for (const seg of segments) {
    // 중첩 <hp:p> 이전 구간만 대상으로 삼아 외부 단락 텍스트와 셀 텍스트를 분리
    const before = seg.split(/<(?:hp|hh):p/)[0];

    const textRegex = /<(?:hp|hh):t(?:\s[^>]*)?>([^<]*)<\/(?:hp|hh):t>/g;
    let match: RegExpExecArray | null;
    const texts: string[] = [];

    while ((match = textRegex.exec(before)) !== null) {
      const text = decodeXmlEntities(match[1]);
      if (text.trim()) texts.push(text);
    }

    const line = texts.join("").trim();
    if (line) lines.push(line);
  }

  return lines;
}

function extractTextFromHwpx(filePath: string): string[] {
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries();

  const sectionFiles = entries
    .filter((e) => /^Contents\/section\d+\.xml$/i.test(e.entryName))
    .sort((a, b) => a.entryName.localeCompare(b.entryName));

  if (sectionFiles.length === 0) {
    throw new Error(`HWPX 섹션 파일을 찾을 수 없습니다: ${filePath}`);
  }

  const lines: string[] = [];
  for (const entry of sectionFiles) {
    const xml = entry.getData().toString("utf-8");
    lines.push(...extractParagraphsFromXml(xml));
  }

  return lines;
}

// ─── Legal Structure Parsing ──────────────────────────────────────────────────

function parseLegalStructure(lines: string[], lawName: string): ParsedLaw {
  const chapters: Chapter[] = [];
  let currentChapter: Chapter | null = null;
  let currentSection: Section | null = null;
  let currentArticle: Article | null = null;
  let currentParagraph: Paragraph | null = null;

  function ensureSection() {
    if (!currentChapter) {
      currentChapter = { chapter: null, sections: [] };
      chapters.push(currentChapter);
    }
    if (
      !currentSection ||
      currentSection !==
        currentChapter.sections[currentChapter.sections.length - 1]
    ) {
      currentSection = { section: null, articles: [] };
      currentChapter.sections.push(currentSection);
    }
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // 제N장
    const chapterMatch = line.match(/^제(\d+)장\s*(.*)/);
    if (chapterMatch) {
      currentParagraph = null;
      currentArticle = null;
      currentSection = null;
      currentChapter = {
        chapter: `제${chapterMatch[1]}장${chapterMatch[2].trim() ? " " + chapterMatch[2].trim() : ""}`,
        sections: [],
      };
      chapters.push(currentChapter);
      continue;
    }

    // 제N절
    const sectionMatch = line.match(/^제(\d+)절\s*(.*)/);
    if (sectionMatch) {
      currentParagraph = null;
      currentArticle = null;
      if (!currentChapter) {
        currentChapter = { chapter: null, sections: [] };
        chapters.push(currentChapter);
      }
      currentSection = {
        section: `제${sectionMatch[1]}절${sectionMatch[2].trim() ? " " + sectionMatch[2].trim() : ""}`,
        articles: [],
      };
      currentChapter.sections.push(currentSection);
      continue;
    }

    // 제N조 / 제N조의M
    const articleMatch = line.match(/^(제\d+조(?:의\d+)?)(?:\s*\(([^)]+)\))?/);
    if (articleMatch) {
      currentParagraph = null;
      ensureSection();
      const articleLabel = articleMatch[2]
        ? `${articleMatch[1]}(${articleMatch[2]})`
        : articleMatch[1];
      currentArticle = {
        article: articleLabel,
        content: line,
        paragraphs: [],
      };
      currentSection!.articles.push(currentArticle);
      continue;
    }

    // ① ② ③ … ⑳
    const paraMatch = line.match(/^([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])\s*(.*)/);
    if (paraMatch && currentArticle) {
      currentParagraph = { paragraph: paraMatch[1], text: paraMatch[2] };
      currentArticle.paragraphs.push(currentParagraph);
      currentArticle.content += "\n" + line;
      continue;
    }

    // 이어지는 내용
    if (currentParagraph) {
      currentParagraph.text += " " + line;
      if (currentArticle) currentArticle.content += "\n" + line;
    } else if (currentArticle) {
      currentArticle.content += "\n" + line;
    }
    // 조문 이전 텍스트 (법 제목, 공포문 등)는 구조 외로 무시
  }

  return { law_name: lawName, structure: { chapters } };
}

// ─── File Discovery ───────────────────────────────────────────────────────────

function findHwpxFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findHwpxFiles(full));
    } else if (extname(entry).toLowerCase() === ".hwpx") {
      results.push(full);
    }
  }
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const rawDir = join(process.cwd(), "data", "raw");
  const files = findHwpxFiles(rawDir);

  if (files.length === 0) {
    console.log("data/raw/ 아래에 .hwpx 파일이 없습니다.");
    return;
  }

  console.log(`총 ${files.length}개 파일 파싱 시작...\n`);

  let success = 0;
  let failed = 0;

  for (const filePath of files) {
    const name = basename(filePath, ".hwpx");
    const outPath = filePath.replace(/\.hwpx$/i, ".json");
    const rel = filePath.replace(process.cwd() + "/", "");

    process.stdout.write(`파싱: ${rel} ... `);

    try {
      const lines = extractTextFromHwpx(filePath);
      const result = parseLegalStructure(lines, name);

      const articleCount = result.structure.chapters.reduce(
        (sum, ch) =>
          sum + ch.sections.reduce((s, sec) => s + sec.articles.length, 0),
        0,
      );

      writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
      console.log(
        `완료 (${result.structure.chapters.length}장, ${articleCount}조)`,
      );
      success++;
    } catch (err) {
      console.error(`실패: ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log(`\n완료: ${success}개 성공, ${failed}개 실패`);
}

main();
