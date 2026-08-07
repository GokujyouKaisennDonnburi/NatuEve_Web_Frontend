import type { ReactNode } from "react";

import { RequiredBadge } from "@/components/atoms/RequiredBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FormCardProps = {
  // 見出しを持たず入力欄だけを載せるカードもあるため、title は任意
  title?: string;
  description?: string;
  // カード内の項目全体が必須のとき、見出しの横に必須バッジを出す
  required?: boolean;
  children: ReactNode;
  className?: string;
};

// フォーム画面で入力項目をまとめる白いカード。
// 1カード＝1つの意味のまとまり（開催情報、参加費用など）として使う。
export function FormCard({
  title,
  description,
  required = false,
  children,
  className,
}: Readonly<FormCardProps>) {
  return (
    <Card
      className={cn(
        "gap-5 rounded-2xl border-slate-200/80 bg-white py-6 shadow-sm shadow-slate-200/60",
        className,
      )}
    >
      {title ? (
        <CardHeader className="gap-1 px-6">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            {title}
            {required ? <RequiredBadge /> : null}
          </CardTitle>
          {description ? (
            <CardDescription className="text-sm text-slate-500">
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className="space-y-5 px-6">{children}</CardContent>
    </Card>
  );
}
