"use client";

import { Minus, Plus } from "lucide-react";

// 人数を増減する円形ボタン
type CounterButtonProps = {
  variant: "decrement" | "increment";
  onClick: () => void;
  disabled?: boolean;
  // スクリーンリーダー向けのラベル（例: 「大人の人数を1減らす」）
  label: string;
};

// 人数を増減する円形ボタン
export function CounterButton({
  variant,
  onClick,
  disabled,
  label,
}: Readonly<CounterButtonProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent"
    >
      {variant === "decrement" ? (
        <Minus className="h-4 w-4" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
    </button>
  );
}
