"use client";

import { cn } from "@/lib/utils";

type FilterTagSize = "sm" | "md";

type FilterTagProps = {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  size?: FilterTagSize;
  className?: string;
};

const sizeClasses: Record<FilterTagSize, string> = {
  sm: "h-6 text-xs font-medium px-3",
  md: "h-[34px] text-sm font-bold px-5",
};

export function FilterTag({
  label,
  selected = false,
  onClick,
  size = "sm",
  className,
  ...props
}: Readonly<FilterTagProps & { title?: string }>) {
  const commonClasses = cn(
    "inline-flex items-center justify-center rounded-full border leading-none text-[#4F584B]",
    "bg-white border-[#97C459] border-[1.5px]",
    sizeClasses[size],
    selected && "bg-[#97C459] text-white",
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        aria-label={label}
        title={props.title}
        className={commonClasses}
      >
        {label}
      </button>
    );
  }

  return (
    <span title={props.title} className={commonClasses}>
      {label}
    </span>
  );
}
