import type { ComponentPropsWithoutRef } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FormInputProps = ComponentPropsWithoutRef<typeof Input>;

// フォーム画面の入力欄。ui/input は直接編集せず、
// 画面共通の見た目（高さ・角丸・フォーカス色）をここで与える。
export function FormInput({ className, ...props }: Readonly<FormInputProps>) {
  return (
    <Input
      {...props}
      className={cn(
        "h-11 rounded-xl border-(--form-border) bg-white text-sm text-slate-900 shadow-none placeholder:text-slate-400",
        "focus-visible:border-(--brand-green) focus-visible:ring-2 focus-visible:ring-(--brand-green)/30",
        "aria-invalid:border-rose-300 aria-invalid:ring-2 aria-invalid:ring-rose-100",
        className,
      )}
    />
  );
}
