import { AppTooltip } from "@/components/atoms/AppTooltip";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

// 主催者用のツールバーのボタンコンポーネントのプロパティ
type EventOrganizerToolbarButtonProps = {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  color?: "green" | "blue" | "orange";
};

// 主催者用のツールバーのボタンコンポーネント
export function EventOrganizerToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  danger = false,
  color,
}: Readonly<EventOrganizerToolbarButtonProps>) {
  const colorClass = danger
    ? "text-red-500 hover:bg-red-50"
    : color === "green"
      ? "text-emerald-600 hover:bg-emerald-50"
      : color === "blue"
        ? "text-sky-600 hover:bg-sky-50"
        : color === "orange"
          ? "text-amber-600 hover:bg-amber-50"
          : "text-slate-600 hover:bg-slate-100";

  return (
    <AppTooltip label={label}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        className={`
          h-12 w-12 rounded-xl cursor-pointer
          transition-colors duration-200
          disabled:cursor-not-allowed
          disabled:opacity-40
          ${colorClass}
        `}
        aria-label={label}
      >
        <Icon className="size-6" />
      </Button>
    </AppTooltip>
  );
}
