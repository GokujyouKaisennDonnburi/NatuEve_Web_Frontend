import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FormEmptyBoxProps = {
  children: ReactNode;
  className?: string;
};

// フォームの繰り返し項目が0件のときに、入力欄と同じ位置に置く枠。
// 枠線の色と太さは FormInput と揃えたうえで点線にすることで、
// 「入力できる欄ではなく、まだ何も無い状態」であることを示す。
// 一覧が空のときの EmptyMessage とは余白も配置も異なるため、別部品として持つ。
export function FormEmptyBox({
  children,
  className,
}: Readonly<FormEmptyBoxProps>) {
  return (
    <div
      className={cn(
        // bg-slate-50 は #f8fafc
        "rounded-xl border border-dashed border-(--form-border) bg-slate-50 px-4 py-3 text-sm text-slate-500",
        className,
      )}
    >
      {children}
    </div>
  );
}
