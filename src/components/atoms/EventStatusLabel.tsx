import { cn } from "@/lib/utils";
import type { ResolvedEventStatus } from "@/utils/eventStatus";

type EventStatusLabelProps = {
  status: ResolvedEventStatus;
  className?: string;
};

// 受付終了と開催終了は「もう申し込めない」ことだけを伝える状態のため、控えめな同じ配色に揃える。
// 開催中も申し込めないが、「いま開催している」ことを伝えるため別の配色にする。
const MUTED_STATUS_STYLE = {
  bgClass: "bg-[rgba(5,5,5,0.1)] border border-[#838C7D]",
  textClass: "text-[#838C7D]",
};

const statusConfig: Record<
  ResolvedEventStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  open: {
    label: "受付中",
    bgClass: "bg-[#85B7EB]",
    textClass: "text-[#1E2C10]",
  },
  few_left: {
    label: "期限間近",
    bgClass: "bg-[#FAC775]",
    textClass: "text-[#77471C]",
  },
  // 開催中の配色は仮決め（デザイン確定後に差し替える）。
  ongoing: {
    label: "開催中",
    bgClass: "bg-[#C5D9A3]",
    textClass: "text-[#1E2C10]",
  },
  ended_registration: {
    label: "受付終了",
    ...MUTED_STATUS_STYLE,
  },
  closed: {
    label: "開催終了",
    ...MUTED_STATUS_STYLE,
  },
};

export function EventStatusLabel({
  status,
  className,
}: Readonly<EventStatusLabelProps>) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full h-[22px] px-3 text-xs font-bold leading-[17px]",
        config.bgClass,
        config.textClass,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
