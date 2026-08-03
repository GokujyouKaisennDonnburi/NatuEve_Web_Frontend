import type { ComponentPropsWithoutRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EventPostCancelButtonProps = ComponentPropsWithoutRef<typeof Button>;

// イベント投稿フォームのキャンセルボタンコンポーネント
export function EventPostCancelButton({
  className,
  children,
  ...props
}: Readonly<EventPostCancelButtonProps>) {
  return (
    <Button
      type="button"
      variant="outline"
      {...props}
      className={cn(
        "rounded-full border border-slate-200 bg-white px-8 py-3 text-sm font-normal text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-300/40",
        className,
      )}
    >
      {children}
    </Button>
  );
}
