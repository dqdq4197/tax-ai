"use client";

import { useMemo } from "react";
import type { UIMessage } from "ai";

export type LawArticleCache = Map<string, string>;

const LAW_TOOL_TYPES = new Set(["tool-vector_search", "tool-law_article_lookup"]);

export function useLawArticleCache(messages: UIMessage[]): LawArticleCache {
  return useMemo(() => {
    const cache = new Map<string, string>();
    for (const message of messages) {
      for (const part of message.parts as unknown[]) {
        const p = part as Record<string, unknown>;
        if (!LAW_TOOL_TYPES.has(p.type as string) || p.state !== "output")
          continue;
        const output = p.output as Array<{ article: string; content: string }>;
        if (!Array.isArray(output)) continue;
        for (const r of output) {
          if (!r.article || !r.content) continue;
          const prev = cache.get(r.article);
          cache.set(r.article, prev ? `${prev}\n\n${r.content}` : r.content);
        }
      }
    }
    return cache;
  }, [messages]);
}

export function findInCache(
  cache: LawArticleCache,
  ref: string,
): string | undefined {
  if (cache.has(ref)) return cache.get(ref);
  const norm = ref.replace(/\s+/g, " ").trim();
  for (const [key, value] of cache) {
    const keyNorm = key.replace(/\s+/g, " ").trim();
    if (keyNorm.includes(norm) || norm.includes(keyNorm)) return value;
  }
  return undefined;
}
