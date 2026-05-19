import { getLawArticleQuery } from "@/remotes";
import { useSuspenseQuery } from "@tanstack/react-query";

function extractArticleTitle(content: string): string {
  const m = content.match(/^제\d+조(?:의\d+)?\(([^)]+)\)/m);
  return m ? m[1] : "";
}

export default function LawArticleTitle({
  articleRef,
}: {
  articleRef: string;
}) {
  const { data } = useSuspenseQuery(getLawArticleQuery(articleRef));
  const title = data.content ? extractArticleTitle(data.content) : "";

  if (!title) {
    return null;
  }

  return <p className="mt-0.5 text-xs text-muted-foreground">{title}</p>;
}
