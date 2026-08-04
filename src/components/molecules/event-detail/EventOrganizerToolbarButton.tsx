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
};

// 主催者用のツールバーのボタンコンポーネント
export function EventOrganizerToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  danger = false,
}: Readonly<EventOrganizerToolbarButtonProps>) {
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
          disabled:cursor-not-allowed
          disabled:opacity-40
          ${
            danger
              ? "text-red-500 hover:text-red-600"
              : "text-slate-600 hover:text-emerald-600"
          }
        `}
        aria-label={label}
      >
        <Icon className="h-5 w-5" />
      </Button>
    </AppTooltip>
  );
}
