import { queryOptions } from "@tanstack/react-query";
import { getLawArticle } from "./api";

export function getLawArticleQuery(ref: string) {
  return queryOptions({
    queryKey: ["law-article", ref],
    queryFn: () => getLawArticle(ref),
    staleTime: Infinity,
  });
}
