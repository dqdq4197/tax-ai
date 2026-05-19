import { getLawArticleQuery } from "@/remotes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { parseLawContent, type Segment } from "./utils/law-content";

interface SectionSegmentsProps {
  segments: Segment[];
}

function SectionSegments({ segments }: SectionSegmentsProps) {
  const items = segments.filter((s) => s.type === "item");
  const rest = segments.filter((s) => s.type !== "item");

  return (
    <>
      <p className="text-foreground">
        {rest.map((seg, i) =>
          seg.type === "amendment" ? (
            <span key={i} className="ml-0.5 text-xs text-muted-foreground">
              {seg.value}
            </span>
          ) : (
            seg.value
          ),
        )}
      </p>
      {items.length > 0 && (
        <ol className="mt-2 space-y-1.5 pl-1">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-foreground/85">
              <span className="shrink-0 font-medium text-foreground">
                {item.num}.
              </span>
              <span>{item.value}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

interface LawArticleContentProps {
  articleRef: string;
}

export default function LawArticleContent({
  articleRef,
}: LawArticleContentProps) {
  const {
    data: { content },
  } = useSuspenseQuery(getLawArticleQuery(articleRef));

  if (!content) {
    return (
      <p className="text-sm text-muted-foreground">
        법령 데이터를 찾을 수 없어요.
      </p>
    );
  }

  const sections = parseLawContent(content);

  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {sections.map((section, i) => (
        <div key={i} className={section.marker ? "flex gap-2.5" : ""}>
          {section.marker && (
            <span className="mt-px shrink-0 font-semibold text-primary">
              {section.marker}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <SectionSegments segments={section.segments} />
          </div>
        </div>
      ))}
    </div>
  );
}
