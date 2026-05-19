import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  text: string;
}

export default function Markdown({ text }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="my-1.5 ml-4 list-disc space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-1.5 ml-4 list-decimal space-y-0.5">{children}</ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        h1: ({ children }) => (
          <h1 className="typo-h3 mb-2 mt-4 text-foreground first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="typo-h4 mb-1.5 mt-3 text-foreground first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="typo-h5 mb-1 mt-2 text-foreground first:mt-0">
            {children}
          </h3>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.startsWith("language-");
          return isBlock ? (
            <code className="block">{children}</code>
          ) : (
            <code className="typo-body4 rounded bg-muted px-1 py-0.5 font-mono text-foreground">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="typo-body4 my-2 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-foreground">
            {children}
          </pre>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto">
            <table className="w-full border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="typo-body4 border border-border bg-muted px-3 py-1.5 text-left text-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="typo-body4 border border-border px-3 py-1.5 text-foreground">
            {children}
          </td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-2 border-border pl-3 text-muted-foreground">
            {children}
          </blockquote>
        ),
        strong: ({ children }) => (
          <strong className="font-bold text-foreground">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        hr: () => <hr className="my-3 border-border" />,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
