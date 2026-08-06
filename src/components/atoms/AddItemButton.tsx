import { Plus } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AddItemButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "variant" | "size" | "type"
>;

// 費用・持ち物・タグなど、行を1件追加するためのピルボタン。
export function AddItemButton({
  className,
  children,
  ...props
}: Readonly<AddItemButtonProps>) {
  return (
    <Button
      {...props}
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-9 w-fit cursor-pointer gap-1 rounded-full border border-(--brand-green-line) bg-(--brand-green-soft) px-4 text-sm font-semibold text-(--brand-green-text) transition hover:bg-(--brand-green-line) hover:text-(--brand-green-text) disabled:opacity-50",
        className,
      )}
    >
      <Plus className="h-4 w-4" />
      {children}
    </Button>
  );
}
