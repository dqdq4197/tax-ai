"use client";

import Link from "next/link";
import { Home, MessageCircle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

const SUGGESTED_ROUTES = [
  {
    icon: MessageCircle,
    label: "새 상담 시작하기",
    href: "/",
    selected: true,
  },
  {
    icon: Home,
    label: "홈으로 돌아가기",
    href: "/",
    selected: false,
  },
  {
    icon: Shield,
    label: "상담 범위",
    href: "/coverage",
    selected: false,
  },
];

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center px-4">
      <div className="flex-2" />
      <div className="flex w-full flex-col items-center">
        <Badge variant="outline" className="mb-6 h-auto gap-2 px-3 py-1.5">
          <span className="size-2 animate-pulse rounded-full bg-amber-400" />
          404
        </Badge>

        <h1 className="mb-3 max-w-sm text-balance text-center text-4xl font-bold leading-tight tracking-tight">
          페이지를 찾을 수 없어요.
        </h1>

        <p className="mb-8 max-w-md text-pretty text-center typo-body1 text-muted-foreground">
          이런 경우가 있어요 — 도움이 될 만한 곳으로 안내해드릴게요.
        </p>

        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-4 py-2.5 typo-caption5 text-muted-foreground">
            추천 경로
          </div>
          <ul>
            {SUGGESTED_ROUTES.map((item) => (
              <li
                key={item.label}
                className={cn(
                  "border-b border-border last:border-0",
                  item.selected && "bg-primary/10",
                )}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 typo-body3",
                    item.selected ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "size-4 shrink-0",
                      item.selected ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex-3" />
    </div>
  );
}
