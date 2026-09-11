"use client";

import { cn } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";

type SortOption = {
  value: string;
  label: string;
};

type SortButtonProps = {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
};

export function SortButton({
  options,
  value,
  onChange,
  label,
  className,
}: Readonly<SortButtonProps>) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? "";

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {label && (
        <span className="text-[13px] leading-[19px] text-[#838C7D] font-normal">
          {label}
        </span>
      )}
      <div className="relative inline-flex items-center h-[52px] bg-white border border-[#CDD4C8] rounded-full px-[17px] gap-2">
        <ArrowUpDown className="h-[14px] w-[14px] text-[#3A4237] shrink-0" />
        {/* 選択中の値は透過 select の下に表示テキストとして描画する */}
        <span className="text-sm font-bold leading-5 text-[#3A4237]">
          {selectedLabel}
        </span>
        {/* ネイティブ select はクリック判定がセレクト要素自体にしかないため、
            透過 select をボタン全体に被せてボタン全体をクリック可能にしている */}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label ?? "並び替え"}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
