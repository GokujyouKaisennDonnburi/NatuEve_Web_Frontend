import type { ComponentPropsWithoutRef } from "react";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FormTextareaProps = ComponentPropsWithoutRef<typeof Textarea>;

// フォーム画面の複数行入力欄。FormInput と見た目を揃える。
export function FormTextarea({
  className,
  ...props
}: Readonly<FormTextareaProps>) {
  return (
    <Textarea
      {...props}
      className={cn(
        "rounded-xl border-(--form-border) bg-white px-3 py-2.5 text-sm text-slate-900 shadow-none placeholder:text-slate-400",
        "focus-visible:border-(--brand-green) focus-visible:ring-2 focus-visible:ring-(--brand-green)/30",
        "aria-invalid:border-rose-300 aria-invalid:ring-2 aria-invalid:ring-rose-100",
        className,
      )}
    />
  );
}
