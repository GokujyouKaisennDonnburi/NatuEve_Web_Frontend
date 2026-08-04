import { Plus } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CreateEventButtonProps = ComponentPropsWithoutRef<typeof Button> & {
  children?: ReactNode;
};

// イベント投稿ページへの導線ボタンコンポーネント（用途が増えた場合、関数名などは適宜変更予定）
export function CreateEventButton({
  className,
  children = "投稿",
  ...props
}: Readonly<CreateEventButtonProps>) {
  return (
    <Button
      {...props}
      className={cn(
        "h-8 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer",
        className,
      )}
    >
      <Plus className="h-3.5 w-3.5" />
      <span>{children}</span>
    </Button>
  );
}
