import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionTitleProps = {
  children: ReactNode;
  center?: boolean;
};

// カード内のセクション見出し（左端に緑の縦バーを伴う）
export function SectionTitle({
  children,
  center = false,
}: Readonly<SectionTitleProps>) {
  return (
    <h2
      className={cn(
        "mb-6 flex items-center gap-3 text-[26px] font-bold text-[#2D401A]",
        center && "justify-center",
      )}
    >
      <span className="h-7 w-1.5 shrink-0 rounded-[3px] bg-[#85A928]" />
      {children}
    </h2>
  );
}
