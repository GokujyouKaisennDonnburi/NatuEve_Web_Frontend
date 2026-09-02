import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type SectionBadgeProps = {
  icon: LucideIcon;
  children: ReactNode;
};

// about ページの各セクション上部に置くピル型バッジ
export function SectionBadge({
  icon: Icon,
  children,
}: Readonly<SectionBadgeProps>) {
  return (
    <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#D4E3B3] bg-[#EEF5DF] px-4 py-1.5 text-[13px] font-bold tracking-[0.02em] text-[#5C781E]">
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}
