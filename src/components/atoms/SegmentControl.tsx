"use client";

import { cn } from "@/lib/utils";
import type { ComponentType } from "react";
import { useId } from "react";

type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
};

type SegmentControlProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
  className?: string;
  "aria-label"?: string;
};

// 2〜3 値程度の表示切り替えに使う pill 型セグメントコントロール。
// イベント投稿画面の「入力 / プレビュー」切り替えなどで利用する。
export function SegmentControl<T extends string>({
  value,
  onChange,
  options,
  className,
  "aria-label": ariaLabel,
}: Readonly<SegmentControlProps<T>>) {
  const name = useId();

  return (
    <fieldset
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center rounded-full bg-slate-200 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const Icon = option.icon;

        return (
          <label
            key={option.value}
            className={cn(
              "relative inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isActive}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {option.label}
          </label>
        );
      })}
    </fieldset>
  );
}
