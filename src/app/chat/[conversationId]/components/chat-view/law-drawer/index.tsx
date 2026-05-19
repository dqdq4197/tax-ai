"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toErrorInfo } from "@/utils/to-error-info";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/utils/cn";
import { BookOpen, Loader2 } from "lucide-react";
import LawArticleTitle from "./law-article-title";
import LawArticleContent from "./law-article-content";

interface LawDrawerProps {
  open: boolean;
  articleRef: string;
  onOpenChange: (open: boolean) => void;
}

export default function LawDrawer({
  open,
  articleRef,
  onOpenChange,
}: LawDrawerProps) {
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        showOverlay={isMobile}
        onInteractOutside={(e) => (isMobile ? undefined : e.preventDefault())}
        className={cn(
          "flex flex-col gap-0 overflow-hidden",
          isMobile ? "max-h-[85vh] rounded-t-2xl" : "sm:max-w-md",
        )}
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <BookOpen className="size-3.5 text-primary" />
            </span>
            <div>
              <SheetTitle className="text-sm leading-tight font-semibold">
                {articleRef}
              </SheetTitle>
              <Suspense fallback={null}>
                <ErrorBoundary fallbackRender={() => null}>
                  <LawArticleTitle articleRef={articleRef} />
                </ErrorBoundary>
              </Suspense>
            </div>
          </div>
        </SheetHeader>

        <div className="h-0 flex-1 overflow-y-auto">
          <div className="px-5 py-5">
            <Suspense
              fallback={
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm">불러오는 중…</span>
                </div>
              }
            >
              <ErrorBoundary
                fallbackRender={({ error }) => (
                  <p className="text-sm text-muted-foreground">
                    {toErrorInfo(error).message}
                  </p>
                )}
              >
                <LawArticleContent articleRef={articleRef} />
              </ErrorBoundary>
            </Suspense>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
