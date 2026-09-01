"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

type SignOutButtonProps = {
  onClick?: () => void;
  className?: string;
};

// マイページのプロフィールカード右上に置くサインアウトボタン。
// Figma デザイン（高さ 36px・白背景・#CDD4C8 枠線の pill、Log out アイコン付き）に準拠。
export function SignOutButton({ onClick, className }: SignOutButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-full border border-[#CDD4C8] bg-white p-0 pl-[13px] font-bold text-[13px] leading-[19px] text-black hover:bg-gray-50",
        className,
      )}
    >
      <LogOut className="size-6 text-[#1E1E1E]" strokeWidth={2.5} />
      <span className="font-['Zen_Kaku_Gothic_New']">サインアウト</span>
    </Button>
  );
}
