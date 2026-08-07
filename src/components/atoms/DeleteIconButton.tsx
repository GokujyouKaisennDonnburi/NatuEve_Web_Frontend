import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeleteIconButtonProps = {
  onClick: () => void;
  // 何を削除するのかを読み上げで判別できるよう、呼び出し側で具体的な文言を渡す
  label: string;
  disabled?: boolean;
  className?: string;
};

// 入力行やファイルを削除するアイコンボタン。EditIconButton と対になる。
export function DeleteIconButton({
  onClick,
  label,
  disabled = false,
  className,
}: Readonly<DeleteIconButtonProps>) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "h-10 w-10 shrink-0 cursor-pointer rounded-xl border border-(--form-border) bg-white text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600",
        className,
      )}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
