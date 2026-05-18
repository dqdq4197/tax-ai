import Link from "next/link";
import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function NewConversationButton() {
  return (
    <>
      {/* New chat button (expanded) */}
      <div className="px-3 mb-2.5 group-data-[collapsible=icon]:hidden">
        <Link
          href="/chat/new"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] border border-sidebar-border bg-card text-sidebar-foreground typo-body2 transition-[background,border-color] duration-150 hover:bg-secondary hover:border-sidebar-primary no-underline min-w-max"
        >
          <Plus size={16} className="text-sidebar-primary shrink-0" />
          <span>새 상담 시작하기</span>
        </Link>
      </div>

      {/* New chat icon (icon mode only) */}
      <div className="hidden group-data-[collapsible=icon]:flex p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/chat/new"
              className="size-8 flex items-center justify-center rounded-lg text-sidebar-primary hover:bg-sidebar-accent transition-[background] duration-150 no-underline"
            >
              <Plus size={16} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">새 상담 시작하기</TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}
