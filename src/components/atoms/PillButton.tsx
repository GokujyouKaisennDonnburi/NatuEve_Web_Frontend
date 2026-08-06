import type { ComponentPropsWithoutRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PillButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "variant" | "size"
> & {
  tone?: "brand" | "outline";
};

// tone ごとの配色。brand の文字色は白ではなく濃色にしている。
// --brand-orange は明度が高く、白文字ではコントラスト比が確保できないため。
const toneClasses: Record<NonNullable<PillButtonProps["tone"]>, string> = {
  brand:
    "bg-(--brand-orange) text-slate-900 shadow-sm hover:bg-(--brand-orange-hover) hover:text-slate-900",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900",
};

// フォーム画面のフッターなどで使う、丸みの強い操作ボタン。
// brand は主操作（送信）、outline は副次操作（キャンセルなど）に使う。
export function PillButton({
  tone = "brand",
  className,
  children,
  ...props
}: Readonly<PillButtonProps>) {
  return (
    <Button
      {...props}
      variant="ghost"
      className={cn(
        "h-11 cursor-pointer rounded-full px-8 text-sm font-semibold transition",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </Button>
  );
}
