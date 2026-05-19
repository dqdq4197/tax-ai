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
  { q: "프리랜서 세금 계산해줘", a: "수입·부양가족 알려주면 세액 계산" },
  { q: "유튜브·블로그 수익도 신고해야 해?", a: "소득 종류별 신고 의무 확인" },
  { q: "단순경비율 vs 기준경비율", a: "나에게 유리한 방식 찾기" },
  { q: "3.3% 원천징수 환급받을 수 있어?", a: "공제 적용 후 환급액 계산" },
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
    <div className="mx-auto max-w-155">
      <ChatComposer
        ref={composerRef}
        value={draft}
        placeholder="예) 프리랜서 디자이너인데 작년 매출이 5천만원이에요."
        disabled={isPending}
        onChange={setDraft}
        onSubmit={() => submit(draft)}
      />

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {quickQuestions.map((item) => (
          <button
            key={item.q}
            type="button"
            disabled={isPending}
            onClick={() => {
              setDraft(item.q);
              composerRef.current?.focus();
            }}
            className="rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-sidebar-primary active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-border"
          >
            <p className="mb-1 typo-body3 text-foreground">{item.q}</p>
            <p className="typo-caption4 text-muted-foreground">{item.a}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
