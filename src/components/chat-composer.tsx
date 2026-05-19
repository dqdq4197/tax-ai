"use client";

import { useImperativeHandle, useRef } from "react";
import { Send, Square } from "lucide-react";
import { cn } from "@/utils/cn";
import { Textarea } from "@/components/ui/textarea";

export interface ChatComposerHandle {
  focus: () => void;
}

interface ChatComposerProps {
  ref?: React.Ref<ChatComposerHandle>;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
}

export default function ChatComposer({
  ref,
  value,
  placeholder = "세금에 대해 무엇이든 물어보세요",
  disabled = false,
  isStreaming = false,
  onChange,
  onSubmit,
  onStop,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  return (
    <div
      className={cn(
        "rounded-3xl border bg-card px-3.5 pt-2.5 pb-2",
        "border-border transition-[border-color,box-shadow] duration-150",
        "focus-within:border-sidebar-primary focus-within:ring-2 focus-within:ring-sidebar-primary/20",
      )}
    >
      <Textarea
        ref={textareaRef}
        rows={1}
        value={value}
        disabled={disabled || isStreaming}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        className="min-h-0 max-h-50 resize-none border-none bg-transparent p-1 typo-body1 leading-relaxed shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0 dark:bg-transparent disabled:bg-transparent dark:disabled:bg-transparent"
      />
      <div className="mt-1.5 flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 typo-caption5 text-muted-foreground/40 sm:flex">
            <kbd className="font-mono w-7 h-5 border rounded-md p-0.5 flex items-center justify-center">
              ⇧↵
            </kbd>
            줄바꿈
            <span>·</span>
            <kbd className="font-mono w-5 h-5 border rounded-md p-0.5 flex items-center justify-center">
              ↵
            </kbd>
            보내기
          </span>
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:translate-y-px"
            >
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={disabled || !value.trim()}
              className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Send size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
