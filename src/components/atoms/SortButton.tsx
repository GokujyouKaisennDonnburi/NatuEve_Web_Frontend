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
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2",
        className,
      )}
    >
      {label && (
        <span className="text-[13px] leading-[19px] text-[#838C7D] font-normal">
          {label}
        </span>
      )}
      <div className="inline-flex items-center h-[52px] bg-white border border-[#CDD4C8] rounded-full px-[17px] gap-2">
        <ArrowUpDown className="h-[14px] w-[14px] text-[#3A4237] shrink-0" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent outline-none cursor-pointer text-sm font-bold leading-5 text-[#3A4237]"
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