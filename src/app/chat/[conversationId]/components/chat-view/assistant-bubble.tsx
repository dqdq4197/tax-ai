import { LoadingDots } from "@/components/ui/loading-dots";
import { BrandIcon } from "@/components/ui/brand-icon";
import Markdown from "./markdown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Check,
  Copy,
  ThumbsDown,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

interface MessageActionProps {
  tooltip: string;
  icon: LucideIcon;
  onClick: () => void;
}

function MessageAction(props: MessageActionProps) {
  const { tooltip, icon: Icon, onClick } = props;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={onClick}>
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function CopyAction({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
          {copied ? <Check /> : <Copy />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {copied ? "복사됨" : "복사"}
      </TooltipContent>
    </Tooltip>
  );
}

interface AssistantBubbleProps {
  content: string;
  isStreaming?: boolean;
  onArticleClick?: (ref: string) => void;
}

export default function AssistantBubble(props: AssistantBubbleProps) {
  const { content, isStreaming = false, onArticleClick } = props;

  return (
    <div className="group/msg flex flex-col gap-3.5">
      <div className="flex gap-3.5">
        <BrandIcon className="mt-0.5" />
        <div className="flex flex-1 items-center">
          {isStreaming && !content ? (
            <LoadingDots />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="space-y-2 text-[15px] leading-relaxed text-muted-foreground">
                {content.split(/\n\n+/).map((segment, i) => (
                  <div key={i} className="animate-in duration-300 fade-in">
                    <Markdown text={segment} onArticleClick={onArticleClick} />
                  </div>
                ))}
              </div>
              <div className="flex gap-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100">
                <CopyAction content={content} />
                <MessageAction
                  icon={ThumbsUp}
                  tooltip="긍정적인 피드백 제공"
                  onClick={() => {}}
                />
                <MessageAction
                  icon={ThumbsDown}
                  tooltip="부정적인 피드백 제공"
                  onClick={() => {}}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
