"use client";

import { cn } from "@/lib/utils";

type EventFilterPillProps = {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
};

export function EventFilterPill({
  label,
  count,
  active,
  onClick,
}: EventFilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center h-10 rounded-full border px-[19px] font-bold text-sm transition-colors",
        active
          ? "bg-[#97C459] border-[#97C459] text-[#1E2C10]"
          : "bg-white border-[#CDD4C8] text-[#1E2C10]",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "ml-2 inline-flex items-center justify-center h-[19px] min-w-[19px] rounded-full px-[5.5px] text-xs font-bold leading-none",
          active
            ? "bg-[rgba(30,44,16,0.12)] text-[#1E2C10]"
            : "bg-[#F1F4EE] text-[#838C7D]",
        )}
      >
        {count}
      </span>
    </button>
  );
}
