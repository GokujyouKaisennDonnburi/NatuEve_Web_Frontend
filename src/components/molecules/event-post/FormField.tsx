import type { ReactNode } from "react";

import { FieldNote } from "@/components/atoms/event-post/FieldNote";
import { RequiredBadge } from "@/components/atoms/event-post/RequiredBadge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({
  id,
  label,
  required = false,
  hint,
  error,
  children,
  className,
}: Readonly<FormFieldProps>) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-semibold text-slate-800">
          {label}
        </Label>
        {required ? <RequiredBadge /> : null}
      </div>
      {children}
      {hint ? <FieldNote>{hint}</FieldNote> : null}
      {error ? <FieldNote tone="error">{error}</FieldNote> : null}
    </div>
  );
}
