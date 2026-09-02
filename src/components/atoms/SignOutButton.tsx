"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, LogOut } from "lucide-react";

type SignOutButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

// Figma デザイン（高さ 36px・白背景・#CDD4C8 枠線の pill、Log out アイコン付き）に準拠。
// 枠線に密着しないよう左右 13px の対称 padding を確保し、アイコンとテキストの色は #1E1E1E に統一する。
// 処理中はボタンを残したまま無効化し、押したボタンが unmount されてフォーカスが落ちないようにする。
export function SignOutButton({
  onClick,
  disabled,
  className,
}: SignOutButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-full border border-[#CDD4C8] bg-white px-[13px] font-bold text-[13px] leading-[19px] text-[#1E1E1E] hover:bg-gray-50 disabled:opacity-60",
        className,
      )}
    >
      {disabled ? (
        <Loader2 className="size-6 animate-spin" aria-hidden={true} />
      ) : (
        <LogOut className="size-6" strokeWidth={2.5} />
      )}
      <span className="font-['Zen_Kaku_Gothic_New']" role="status">
        {disabled ? "サインアウト中..." : "サインアウト"}
      </span>
    </Button>
  );
}
