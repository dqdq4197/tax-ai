"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ChatComposer, {
  type ChatComposerHandle,
} from "@/components/chat-composer";
import { setPendingChat } from "@/utils/pending-prompt";
import { useCreateConversation } from "@/app/(home)/hooks/useCreateConversation";
import { toErrorInfo } from "@/utils/to-error-info";
import { toast } from "sonner";

const quickQuestions = [
  { q: "단순경비율 vs 기준경비율", a: "나에게 유리한 방식 찾기" },
  { q: "업종코드를 모르겠어요", a: "직업으로 설명하면 코드 찾아드려요" },
  { q: "3.3% 원천징수 환급", a: "얼마나 돌려받을 수 있는지" },
  { q: "부양가족 공제 받을 수 있나요", a: "소득세법 기준으로 조건 확인" },
];

export default function ChatStarter() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const composerRef = useRef<ChatComposerHandle>(null);
  const { mutate: createConversation, isPending } = useCreateConversation();

  const submit = async (value: string) => {
    const firstMessage = value.trim();
    if (!firstMessage || isPending) return;

    createConversation(undefined, {
      onSuccess: ({ id }) => {
        setPendingChat({ conversationId: id, firstMessage });
        router.push(`/chat/${id}`);
      },
      onError: (error) => {
        const { message } = toErrorInfo(error);
        toast.error(message);
      },
    });
  };

  return (
    <div className="max-w-155 mx-auto">
      <ChatComposer
        ref={composerRef}
        value={draft}
        placeholder="예) 프리랜서 디자이너인데 작년 매출이 5천만원이에요."
        disabled={isPending}
        onChange={setDraft}
        onSubmit={() => submit(draft)}
      />

      <div className="grid grid-cols-2 gap-2.5 mt-5">
        {quickQuestions.map((item) => (
          <button
            key={item.q}
            type="button"
            disabled={isPending}
            onClick={() => {
              setDraft(item.q);
              composerRef.current?.focus();
            }}
            className="text-left bg-card border border-border rounded-xl px-4 py-3.5 hover:border-sidebar-primary hover:-translate-y-px active:translate-y-px transition-[border-color,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:translate-y-0"
          >
            <p className="typo-body3 text-foreground mb-1">{item.q}</p>
            <p className="typo-caption4 text-muted-foreground">{item.a}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
