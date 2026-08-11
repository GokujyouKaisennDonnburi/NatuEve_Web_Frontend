import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { BackLink } from "@/components/atoms/BackLink";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  backHref: ComponentPropsWithoutRef<typeof BackLink>["href"];
  backLabel: string;
  className?: string;
  right?: ReactNode;
};

// 画面上部の「もどるリンク＋見出し」のまとまり。
// right スロットを使うと見出しの右側に任意の要素を配置できる。
export function PageHeader({
  title,
  backHref,
  backLabel,
  className,
  right,
}: Readonly<PageHeaderProps>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        <BackLink href={backHref}>{backLabel}</BackLink>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
      </div>
      {right}
    </div>
  );
}
