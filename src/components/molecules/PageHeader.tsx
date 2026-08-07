import type { ComponentPropsWithoutRef } from "react";

import { BackLink } from "@/components/atoms/BackLink";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  backHref: ComponentPropsWithoutRef<typeof BackLink>["href"];
  backLabel: string;
  className?: string;
};

// 画面上部の「もどるリンク＋見出し」のまとまり。
export function PageHeader({
  title,
  backHref,
  backLabel,
  className,
}: Readonly<PageHeaderProps>) {
  return (
    <div className={cn("space-y-2", className)}>
      <BackLink href={backHref}>{backLabel}</BackLink>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>
    </div>
  );
}
