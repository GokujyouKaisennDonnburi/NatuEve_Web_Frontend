import type { ReactNode } from "react";

import { FieldNote } from "@/components/atoms/FieldNote";
import { RequiredBadge } from "@/components/atoms/RequiredBadge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// required / optional は排他。判別可能ユニオンで同時指定を型で防ぐ。
type FormFieldProps = {
  id: string;
  label: string;
  description?: string; // 入力欄の前に置く説明文
  hint?: string; // 入力欄の後に置く補足
  error?: string;
  // エラー表示に付ける id。入力欄の aria-describedby から参照して
  // エラー文をスクリーンリーダーに読ませる。
  errorId?: string;
  children: ReactNode; // フォームフィールドの内容を指定するプロパティ
  className?: string;
} & (
  | { required: true; optional?: never }
  | { required?: false; optional?: boolean }
);

// フォームフィールドコンポーネント
export function FormField({
  id,
  label,
  required = false,
  optional = false,
  description,
  hint,
  error,
  errorId,
  children,
  className,
}: Readonly<FormFieldProps>) {
  return (
    // error はバリデーション結果に基づくため、この印はそのまま
    // 「送信をブロックするエラーがある項目」を意味する。
    <div
      className={cn("space-y-2", className)}
      data-field-error={error ? "" : undefined}
    >
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="text-sm font-semibold text-slate-800">
          {label}
        </Label>
        {required ? <RequiredBadge /> : null}
        {optional ? <RequiredBadge isRequired={false} /> : null}
      </div>
      {description ? <FieldNote>{description}</FieldNote> : null} {children}
      {hint ? <FieldNote>{hint}</FieldNote> : null}
      {error ? (
        <FieldNote tone="error" id={errorId}>
          {error}
        </FieldNote>
      ) : null}
    </div>
  );
}
