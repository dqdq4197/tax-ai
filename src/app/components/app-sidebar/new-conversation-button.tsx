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
      <div className="mb-2.5 px-3 group-data-[collapsible=icon]:hidden">
        <Link
          href="/"
          className="flex min-w-max items-center gap-2.5 rounded-[12px] border border-sidebar-border bg-card px-3 py-2.5 typo-body2 text-sidebar-foreground no-underline transition-[background,border-color] duration-150 hover:border-sidebar-primary hover:bg-secondary"
        >
          <Plus size={16} className="shrink-0 text-sidebar-primary" />
          <span>새 상담 시작하기</span>
        </Link>
      </div>

      {/* New chat icon (icon mode only) */}
      <div className="hidden p-2 group-data-[collapsible=icon]:flex">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/"
              className="flex size-8 items-center justify-center rounded-lg text-sidebar-primary no-underline transition-[background] duration-150 hover:bg-sidebar-accent"
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
