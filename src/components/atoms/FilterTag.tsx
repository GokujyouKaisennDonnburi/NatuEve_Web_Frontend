import { cn } from "@/lib/utils";

type FilterTagProps = {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
};

export function FilterTag({
  label,
  selected = false,
  onClick,
  className,
}: Readonly<FilterTagProps>) {
  const commonClasses = cn(
    "inline-flex items-center justify-center rounded-full border px-3 text-xs font-medium leading-none text-[#4F584B]",
    "h-6 bg-white border-[#97C459] border-[1.5px]",
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
        className={commonClasses}
      >
        {label}
      </button>
    );
  }

  return <span className={commonClasses}>{label}</span>;
}
