import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen } from "lucide-react";

const ARTICLE_REF_RE =
  /(소득세법(?:\s+시행령|\s+시행규칙)?)\s+(제\d+조(?:의\d+)?)/g;

function linkifyArticleRefs(text: string): string {
  return text.replace(ARTICLE_REF_RE, (match) => {
    const ref = match.replace(/\s+/g, " ").trim();
    return `[${match}](article://${encodeURIComponent(ref)})`;
  });
}

interface Props {
  text: string;
  onArticleClick?: (ref: string) => void;
}

export default function Markdown({ text, onArticleClick }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      urlTransform={(url) => url}
      components={{
        p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="my-2 ml-4 list-disc space-y-1.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-2 ml-4 list-decimal space-y-1.5">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => (
          <h1 className="mt-6 mb-2.5 typo-h3 text-foreground first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-5 mb-2 typo-h4 text-foreground first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-4 mb-1.5 typo-h5 text-foreground first:mt-0">
            {children}
          </h3>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.startsWith("language-");
          return isBlock ? (
            <code className="block">{children}</code>
          ) : (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono typo-body4 text-foreground">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="my-3 overflow-x-auto rounded-lg bg-muted p-4 font-mono typo-body4 leading-relaxed text-foreground">
            {children}
          </pre>
        ),
        a: ({ href, children }) => {
          if (href?.startsWith("article://")) {
            const ref = decodeURIComponent(href.slice("article://".length));
            return (
              <button
                type="button"
                onClick={() => onArticleClick?.(ref)}
                className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/8 px-1.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
              >
                <BookOpen className="size-3" />
                {children}
              </button>
            );
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          );
        },
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto">
            <table className="w-full border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-muted px-3 py-2 text-left typo-body4 text-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-3 py-2 typo-body4">
            {children}
          </td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-3 border-l-2 border-border pl-4 text-muted-foreground italic">
            {children}
          </blockquote>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        hr: () => <hr className="my-5 border-border" />,
      }}
    >
      {linkifyArticleRefs(text)}
    </ReactMarkdown>
  );
}
