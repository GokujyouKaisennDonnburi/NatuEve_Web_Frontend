import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// セクションの見出しを表示するコンポーネント
type SectionHeadingProps = {
  eyebrow: string; // セクションの小見出しを指定するプロパティ
  title: string; // セクションの大見出しを指定するプロパティ
  description: string; // セクションの説明文を指定するプロパティ
  icon?: ReactNode; // セクションの小見出しの横に表示するアイコンを指定するプロパティ
  className?: string;
};

// セクションの見出しを表示するコンポーネント
export function SectionHeading({
  eyebrow,
  title,
  description,
  icon,
  className,
}: Readonly<SectionHeadingProps>) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
        {icon ? <span className="text-base text-teal-600">{icon}</span> : null}
        <span>{eyebrow}</span>
      </p>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}
