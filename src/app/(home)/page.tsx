import ChatStarter from "./components/chat-starter";

export default function Home() {
  return (
    <div className="px-6 pt-14 pb-20">
      <div className="max-w-230 mx-auto">
        <div className="text-center pt-7 pb-12">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5 typo-body4 text-muted-foreground mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_oklch(0.765_0.177_163)] animate-pulse shrink-0" />
            2026년 5월 종합소득세 신고 시즌
          </div>

          {/* Heading */}
          <h1 className="text-[40px] font-semibold leading-[1.15] tracking-[-0.02em] text-balance mb-4">
            세법 질문도, 세액 계산도
            <br />
            <span className="bg-linear-to-r from-blue-300 to-indigo-400 bg-clip-text text-transparent">
              대화 하나로 끝내요.
            </span>
          </h1>

          {/* Lead */}
          <p className="text-base text-muted-foreground leading-relaxed max-w-145 mx-auto mb-8">
            프리랜서·개인사업자를 위한 종합소득세 AI 상담사. 세법이 궁금하면
            소득세법·시행령을 검색해 조항을 근거로 답하고, 세액이 필요하면 직접
            계산해드려요.
          </p>

          <ChatStarter />
        </div>
      </div>
    </div>
  );
}
