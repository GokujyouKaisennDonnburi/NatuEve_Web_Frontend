import { cn } from "@/lib/utils";

type TogglePillProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
};

export function TogglePill({
  checked,
  onCheckedChange,
  id,
}: Readonly<TogglePillProps>) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-20 items-center rounded-full border px-1 transition-all duration-200",
        checked
          ? "border-teal-600 bg-teal-600"
          : "border-slate-300 bg-slate-200 hover:border-slate-400",
      )}
    >
      <span
        className={cn(
          "absolute left-2 text-[10px] font-semibold tracking-wide opacity-0 transition-opacity duration-200",
          !checked && "opacity-100 text-slate-800",
          checked && "opacity-100 text-white",
        )}
      >
        OFF
      </span>
      <span
        className={cn(
          "pointer-events-none h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-11" : "translate-x-0",
        )}
      />
      <span
        className={cn(
          "absolute right-2 text-[10px] font-semibold tracking-wide opacity-0 transition-opacity duration-200",
          !checked && "opacity-100 text-slate-900",
          checked && "text-slate-800",
        )}
      >
        ON
      </span>
    </button>
  );
}
