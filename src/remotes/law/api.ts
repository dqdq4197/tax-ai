import { z } from "zod";
import { client } from "../core/client";

const LawArticleSchema = z.object({
  article: z.string(),
  content: z.string().nullable(),
});

export type LawArticle = z.infer<typeof LawArticleSchema>;

export function getLawArticle(ref: string) {
  return client
    .get("law/articles", { searchParams: { ref } })
    .json(LawArticleSchema);
}
