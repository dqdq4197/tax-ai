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
        p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="my-2 ml-4 list-disc space-y-1.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-2 ml-4 list-decimal space-y-1.5">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => (
          <h1 className="typo-h3 mb-2.5 mt-6 text-foreground first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="typo-h4 mb-2 mt-5 text-foreground first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="typo-h5 mb-1.5 mt-4 text-foreground first:mt-0">
            {children}
          </h3>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.startsWith("language-");
          return isBlock ? (
            <code className="block">{children}</code>
          ) : (
            <code className="typo-body4 rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="typo-body4 my-3 overflow-x-auto rounded-lg bg-muted p-4 font-mono leading-relaxed text-foreground">
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
          <div className="my-3 overflow-x-auto">
            <table className="w-full border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="typo-body4 border border-border bg-muted px-3 py-2 text-left text-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="typo-body4 border border-border px-3 py-2">
            {children}
          </td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-3 border-l-2 border-border pl-4 italic text-muted-foreground">
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
      {text}
    </ReactMarkdown>
  );
}
