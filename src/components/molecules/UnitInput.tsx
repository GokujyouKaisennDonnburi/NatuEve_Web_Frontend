import type { ComponentPropsWithoutRef } from "react";

import { FormInput } from "@/components/atoms/FormInput";
import { cn } from "@/lib/utils";

type UnitInputProps = ComponentPropsWithoutRef<typeof FormInput> & {
  // 「円」「名」など入力欄の右端に添える単位
  unit: string;
};

// 末尾に単位を表示する入力欄。
// 単位は装飾のため aria-hidden とし、意味はラベル側で担保する。
export function UnitInput({
  unit,
  className,
  ...props
}: Readonly<UnitInputProps>) {
  return (
    <div className="relative">
      <FormInput {...props} className={cn("pr-10", className)} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500"
      >
        {unit}
      </span>
    </div>
  );
}
