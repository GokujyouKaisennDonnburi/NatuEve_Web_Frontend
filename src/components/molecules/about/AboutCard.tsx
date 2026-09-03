import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AboutCardProps = {
  children: ReactNode;
  className?: string;
};

// about ページの各セクションを載せる白カードの土台。
//
// 既存の SurfaceCard はスレート系の配色と py-6 固定の余白を持つため、
// about デザインモックの緑系の枠線・角丸・余白には合わない。
// そのため about 専用のカードとしてここで一括して与える。
export function AboutCard({ children, className }: Readonly<AboutCardProps>) {
  return (
    <section
      className={cn(
        "rounded-[20px] border border-[#85A928]/25 bg-white p-6 shadow-[0_4px_20px_rgba(120,140,100,0.08)] md:p-10",
        className,
      )}
    >
      {children}
    </section>
  );
}
