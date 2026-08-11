import type { ReactNode } from "react";

import { RequiredBadge } from "@/components/atoms/RequiredBadge";
import { SurfaceCard } from "@/components/molecules/SurfaceCard";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
// カードの表面（白背景・角丸・枠線・影）は SurfaceCard に委ね、
// ここでは見出しと必須バッジの並びだけを受け持つ。
export function FormCard({
  title,
  description,
  required = false,
  children,
  className,
}: Readonly<FormCardProps>) {
  return (
    <SurfaceCard className={className}>
      {title ? (
        <CardHeader className="gap-1 px-6">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            {title}
            {required ? <RequiredBadge /> : null}
          </CardTitle>
          {/* 説明文に改行を入れて読み分けさせたいカードがあるため、改行を保持する */}
          {description ? (
            <CardDescription className="text-sm whitespace-pre-line text-slate-500">
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className="space-y-5 px-6">{children}</CardContent>
    </SurfaceCard>
  );
}
