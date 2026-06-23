import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FieldNoteProps = {
  tone?: "default" | "error";
  children: ReactNode;
};

const toneClasses: Record<NonNullable<FieldNoteProps["tone"]>, string> = {
  default: "text-sm text-slate-500",
  error: "text-sm font-medium text-rose-600",
};

export function FieldNote({
  tone = "default",
  children,
}: Readonly<FieldNoteProps>) {
  return <p className={cn(toneClasses[tone])}>{children}</p>;
}
