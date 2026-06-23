import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
};

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
