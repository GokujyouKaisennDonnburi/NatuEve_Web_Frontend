import type { ReactNode } from "react";

import { FieldNote } from "@/components/atoms/FieldNote";
import { RequiredBadge } from "@/components/atoms/RequiredBadge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// フォームフィールドコンポーネントのプロパティを定義
type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  description?: string; // 入力欄の前に置く説明文
  hint?: string; // 入力欄の後に置く補足
  error?: string;
  children: ReactNode; // フォームフィールドの内容を指定するプロパティ
  className?: string;
};

// フォームフィールドコンポーネント
export function FormField({
  id,
  label,
  required = false,
  description,
  hint,
  error,
  children,
  className,
}: Readonly<FormFieldProps>) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="text-sm font-semibold text-slate-800">
          {label}
        </Label>
        {required ? <RequiredBadge /> : null}
      </div>
      {description ? <FieldNote>{description}</FieldNote> : null}
      {children}
      {hint ? <FieldNote>{hint}</FieldNote> : null}
      {error ? <FieldNote tone="error">{error}</FieldNote> : null}
    </div>
  );
}
