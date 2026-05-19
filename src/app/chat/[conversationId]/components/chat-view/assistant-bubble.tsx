import { LoadingDots } from "@/components/ui/loading-dots";
import { BrandIcon } from "@/components/ui/brand-icon";
import Markdown from "./markdown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Copy, ThumbsDown, ThumbsUp, type LucideIcon } from "lucide-react";

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

interface AssistantBubbleProps {
  content: string;
  isStreaming?: boolean;
}

export default function AssistantBubble(props: AssistantBubbleProps) {
  const { content, isStreaming = false } = props;

  return (
    <div className="group/msg flex flex-col gap-3.5">
      <div className="flex gap-3.5">
        <BrandIcon className="mt-0.5" />
        <div className="flex-1">
          {isStreaming && !content ? (
            <LoadingDots />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="typo-body1 leading-relaxed text-foreground">
                <Markdown text={content} />
                {isStreaming && (
                  <span
                    className="ml-0.5 inline-block h-[1em] w-2 animate-pulse rounded-sm bg-primary"
                    style={{ verticalAlign: "-2px" }}
                  />
                )}
              </div>
              <div className="flex gap-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100">
                <MessageAction
                  icon={Copy}
                  tooltip="복사"
                  onClick={() => navigator.clipboard.writeText(content)}
                />
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
