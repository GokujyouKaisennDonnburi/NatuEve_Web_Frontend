import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// フィールドの補足説明やエラーメッセージを表示するコンポーネント
type FieldNoteProps = {
  tone?: "default" | "error"; // フィールドの補足説明やエラーメッセージのトーンを指定するプロパティ
  // aria-describedby で入力欄と関連付ける場合の id。指定がなければ出力しない。
  id?: string;
  children: ReactNode; // フィールドの補足説明やエラーメッセージの内容を指定するプロパティ
};

// フィールドの補足説明やエラーメッセージを表示するコンポーネントのトーンに応じたクラス名を定義
const toneClasses: Record<NonNullable<FieldNoteProps["tone"]>, string> = {
  default: "text-sm text-slate-500", // デフォルトのトーンのクラス名
  error: "text-sm font-medium text-rose-600", // エラーのトーンのクラス名
};

// フィールドの補足説明やエラーメッセージを表示するコンポーネント
export function FieldNote({
  tone = "default",
  id,
  children,
}: Readonly<FieldNoteProps>) {
  return (
    <p id={id} className={cn(toneClasses[tone])}>
      {children}
    </p>
  );
}
