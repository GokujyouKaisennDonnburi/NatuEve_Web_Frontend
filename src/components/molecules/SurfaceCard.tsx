import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
};

// 画面上でひとまとまりの内容を載せる「白いカード」の土台。
//
// shadcn 由来の ui/card は背景に bg-card を指定しているが、
// このプロジェクトは --card トークンを定義していないため背景が透明になり、
// 枠線も色指定が無く currentColor（≒黒）になってしまう。
// そのため白背景・枠線・角丸・影をここで一括して与え、
// イベント投稿フォーム（FormCard 経由）とイベント詳細で同じ見た目を共有する。
export function SurfaceCard({
  children,
  className,
}: Readonly<SurfaceCardProps>) {
  return (
    <Card
      className={cn(
        "gap-5 rounded-2xl border-slate-200/80 bg-white py-6 shadow-sm shadow-slate-200/60",
        className,
      )}
    >
      {children}
    </Card>
  );
}
