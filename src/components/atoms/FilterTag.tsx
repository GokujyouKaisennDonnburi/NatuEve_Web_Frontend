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

  // text-overflow は flex コンテナ自身には効かないため、ラベルを内側の
  // span で包んでおく。幅に制約があるときだけ ... 省略が働き、
  // 制約がなければ自然幅のまま表示される(#467)。
  const labelElement = <span className="truncate">{label}</span>;

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
        {labelElement}
      </button>
    );
  }

  return (
    <span title={props.title} className={commonClasses}>
      {labelElement}
    </span>
  );
}
