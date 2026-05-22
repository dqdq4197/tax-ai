import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils/cn";

const supportedItems = [
  "프리랜서 (3.3% 원천징수 대상)",
  "1인 사업자 · 개인사업자",
  "단순경비율 계산 (1,541개 업종코드)",
  "기준경비율 계산 (매입·임차료·인건비 공제)",
  "부양가족 기본공제 · 국민연금보험료 공제",
  "환급·납부세액 계산",
  "세법 조항 근거 검색 및 인용 (소득세법·시행령)",
];

const plannedItems = [
  "기타소득 · 금융소득 · 연금소득 · 임대소득",
  "근로소득",
  "해외주식 · 국내 주식 양도소득",
  "가상자산 소득",
  "장부신고 · 필요경비 판단 · 홈택스 안내",
];

const roadmap = [
  {
    step: 1,
    label: "사업소득 · 프리랜서",
    desc: "단순/기준경비율, 부양가족·국민연금 공제, 환급·납부세액",
    when: "2026 Q2 · 현재",
    isCurrent: true,
  },
  {
    step: 2,
    label: "기타·금융·연금·임대소득",
    desc: "강연·원고료 60% 공제, 이자·배당 분리과세, 연금소득공제, 임대소득",
    when: "2026 Q3",
    isCurrent: false,
  },
  {
    step: 3,
    label: "근로소득 합산",
    desc: "근로+사업소득 동시 보유자 합산 계산, 연말정산 연동",
    when: "2026 Q4",
    isCurrent: false,
  },
  {
    step: 4,
    label: "해외주식 · 주식 양도소득",
    desc: "해외주식 연 250만원 공제, 국내 대주주 양도소득세 계산",
    when: "2027 Q1",
    isCurrent: false,
  },
  {
    step: 5,
    label: "가상자산 소득",
    desc: "가상자산 양도·대여 소득, 연 250만원 기본공제",
    when: "2027 Q2",
    isCurrent: false,
  },
  {
    step: 6,
    label: "장부신고 · 필요경비 판단 · 홈택스 안내",
    desc: "실제 경비 장부 기반 계산, 항목별 인정 판단, 홈택스 신고 단계 안내",
    when: "2027 Q3",
    isCurrent: false,
  },
];

export default function CoveragePage() {
  return (
    <div className="h-full overflow-y-auto px-6 py-14 pb-20">
      <div className="mx-auto max-w-230">
        <h1 className="mb-2 text-[28px] leading-snug font-semibold tracking-tight">
          상담 범위
        </h1>
        <p className="mb-7 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">
          tax·ai는 현재{" "}
          <strong className="font-medium text-foreground">
            사업소득(프리랜서 포함)
          </strong>
          의 종합소득세 상담만 지원해요. 정확한 답변을 위해 범위를 좁히고 있고,
          다른 소득 유형은 단계적으로 확장 중이에요.
        </p>

        <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* 현재 지원 */}
          <Card className="gap-0 border border-emerald-400 bg-linear-to-br from-card to-emerald-400/5 py-0">
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <h3 className="typo-h4 leading-snug font-semibold">
                  현재 지원
                </h3>
                <span className="rounded-full bg-emerald-400 px-2 py-1 typo-bold11 leading-none tracking-wide text-emerald-950">
                  사업소득
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <ul>
                {supportedItems.map((item, i) => (
                  <li
                    key={item}
                    className={cn(
                      "flex items-center gap-2.5 py-2 typo-caption3 text-muted-foreground",
                      i > 0 && "border-t border-border/60",
                    )}
                  >
                    <Check size={14} className="shrink-0 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 typo-caption4 leading-relaxed text-muted-foreground/70">
                2023–2025년 세법 기준. 업종코드별 경비율은 국세청 고시를 직접
                반영해요.
              </p>
            </CardContent>
          </Card>

          {/* 지원 예정 */}
          <Card className="gap-0 border py-0">
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <h3 className="typo-h4 leading-snug font-semibold">
                  세액 계산 예정
                </h3>
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-1 typo-bold11 tracking-wide"
                >
                  로드맵
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <ul>
                {plannedItems.map((item, i) => (
                  <li
                    key={item}
                    className={cn(
                      "flex items-center gap-2.5 py-2 typo-caption3 text-muted-foreground",
                      i > 0 && "border-t border-border/60",
                    )}
                  >
                    <X
                      size={14}
                      className="shrink-0 text-muted-foreground/40"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 typo-caption4 leading-relaxed text-muted-foreground/70">
                법령 문의는 이미 가능해요. 세액 계산만 단계적으로 추가 중이에요.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Roadmap */}
        <div className="mt-5">
          <h2 className="mb-3.5 typo-h2 leading-snug font-semibold tracking-tight">
            지원 확장 로드맵
          </h2>
          <ol>
            {roadmap.map((item, i) => (
              <li key={item.step}>
                {i > 0 && <Separator className="opacity-60" />}
                <div className="grid grid-cols-[28px_1fr_auto] items-center gap-3.5 py-3.5">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono typo-bold11",
                      item.isCurrent
                        ? "bg-sidebar-primary text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.step}
                  </div>
                  <div>
                    <p className="typo-body2 leading-snug">{item.label}</p>
                    <p className="mt-0.5 typo-caption4 leading-snug text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "font-mono typo-body5 whitespace-nowrap",
                      item.isCurrent
                        ? "text-sidebar-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.when}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
