import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyMessageProps = {
  children: ReactNode;
  // compact はフォーム内の「未設定」表示用。default は一覧が空のときの表示用
  variant?: "default" | "compact";
};

const variantClasses: Record<
  NonNullable<EmptyMessageProps["variant"]>,
  string
> = {
  default: "py-12 text-center",
  compact: "px-4 py-3",
};

export function EmptyMessage({
  children,
  variant = "default",
}: Readonly<EmptyMessageProps>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-slate-200/50 bg-white/50 text-sm text-slate-500",
        variantClasses[variant],
      )}
    >
      {children}
    </div>
  );
}
