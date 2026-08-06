"use client";

import { cn } from "@/lib/utils";

type FilterIconButtonProps = {
  onClick: () => void;
  isActive?: boolean;
  className?: string;
};

export function FilterIconButton({
  onClick,
  isActive = false,
  className,
}: Readonly<FilterIconButtonProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 h-[38px] bg-white border rounded-full px-[19px]",
        isActive ? "border-[#97C459]" : "border-[#CDD4C8]",
        className,
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <line
          x1="3"
          y1="5"
          x2="21"
          y2="5"
          stroke="#3A4237"
          strokeWidth="1.33333"
          strokeLinecap="round"
        />
        <line
          x1="3"
          y1="12"
          x2="15"
          y2="12"
          stroke="#3A4237"
          strokeWidth="1.33333"
          strokeLinecap="round"
        />
        <line
          x1="3"
          y1="19"
          x2="18"
          y2="19"
          stroke="#3A4237"
          strokeWidth="1.33333"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-sm font-bold leading-5 text-[#3A4237] whitespace-nowrap">
        絞り込み
      </span>
    </button>
  );
}
