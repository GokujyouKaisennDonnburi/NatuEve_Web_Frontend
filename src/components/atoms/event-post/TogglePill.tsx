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
        "inline-flex h-8 min-w-16 items-center justify-center rounded-full border px-3 text-xs font-semibold tracking-wide transition-colors",
        checked
          ? "border-teal-600 bg-teal-600 text-white"
          : "border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700",
      )}
    >
      {checked ? "ON" : "OFF"}
    </button>
  );
}
