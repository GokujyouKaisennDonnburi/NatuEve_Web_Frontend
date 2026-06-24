import { Badge as UiBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

type BadgeProps = ComponentPropsWithoutRef<typeof UiBadge> & {
  tone?: "default" | "accent" | "subtle";
};

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  default: "bg-slate-900 text-white",
  accent: "bg-teal-950 text-white",
  subtle: "bg-teal-100 text-teal-900",
};

export function Badge({
  tone = "default",
  className,
  ...props
}: Readonly<BadgeProps>) {
  return (
    <UiBadge
      {...props}
      variant="ghost"
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        toneClasses[tone],
        className,
      )}
    />
  );
}
