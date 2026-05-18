"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { cn } from "@/utils/cn";
import { Textarea } from "@/components/ui/textarea";

const quickQuestions = [
  { q: "단순경비율 vs 기준경비율", a: "나에게 유리한 방식 찾기" },
  { q: "업종코드를 모르겠어요", a: "직업으로 설명하면 코드 찾아드려요" },
  { q: "3.3% 원천징수 환급", a: "얼마나 돌려받을 수 있는지" },
  { q: "부양가족 공제 받을 수 있나요", a: "소득세법 기준으로 조건 확인" },
];

export default function ChatStarter() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");

  const submit = (value: string) => {
    const q = value.trim();
    if (!q) return;
    router.push(`/chat/new?q=${encodeURIComponent(q)}`);
  };

  const fillDraft = (question: string) => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    setDraft(question);
  };

  return (
    <div className="max-w-155 mx-auto">
      <div
        className={cn(
          "rounded-3xl border bg-card px-3.5 pt-2.5 pb-2",
          "border-border transition-[border-color,box-shadow] duration-150",
          "focus-within:border-sidebar-primary focus-within:ring-2 focus-within:ring-sidebar-primary/20",
        )}
      >
        <Textarea
          ref={textareaRef}
          name="chat-input"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e.currentTarget.value);
            }
          }}
          placeholder="예) 프리랜서 디자이너인데 작년 매출이 5천만원이에요."
          className="border-none p-1 rounded-none shadow-none focus-visible:ring-0 resize-none bg-transparent dark:bg-transparent text-[15px] leading-relaxed placeholder:text-muted-foreground/50 max-h-50 min-h-0"
        />
        <div className="flex items-center justify-between mt-1.5">
          <div />
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1 typo-caption5 text-muted-foreground/40">
              <kbd className="font-mono">⇧↵</kbd>
              줄바꿈
              <span>·</span>
              <kbd className="font-mono">↵</kbd>
              보내기
            </span>
            <button
              type="button"
              onClick={() => submit(textareaRef.current?.value ?? "")}
              disabled={draft.trim() === ""}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-sidebar-primary text-white disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 active:translate-y-px transition-[opacity,transform] duration-150"
            >
              <ArrowUp size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick questions */}
      <div className="grid grid-cols-2 gap-2.5 mt-5">
        {quickQuestions.map((item) => (
          <button
            key={item.q}
            type="button"
            onClick={() => fillDraft(item.q)}
            className="text-left bg-card border border-border rounded-xl px-4 py-3.5 hover:border-sidebar-primary hover:-translate-y-px active:translate-y-px transition-[border-color,transform] duration-150"
          >
            <p className="typo-body3 text-foreground mb-1">{item.q}</p>
            <p className="typo-caption4 text-muted-foreground">{item.a}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
