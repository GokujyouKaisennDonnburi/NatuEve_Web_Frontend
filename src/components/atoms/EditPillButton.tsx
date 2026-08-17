"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

type EditPillButtonProps = {
  onClick?: () => void;
  size?: "sm" | "md";
  className?: string;
};

const SIZE_MAP = {
  sm: { label: "編集", iconSize: 12, buttonClass: "h-[30px] text-xs px-[14px]" },
  md: { label: "名前を編集", iconSize: 13, buttonClass: "h-8 text-sm px-[15px]" },
} as const;

export function EditPillButton({
  onClick,
  size = "sm",
  className,
}: EditPillButtonProps) {
  const config = SIZE_MAP[size];

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#CDD4C8] bg-white text-[#3A4237] font-bold hover:bg-gray-50",
        config.buttonClass,
        className,
      )}
    >
      <Pencil
        style={{ width: config.iconSize, height: config.iconSize }}
        stroke="#3A4237"
      />
      <span>{config.label}</span>
    </Button>
  );
}