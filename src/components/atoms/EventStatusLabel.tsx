import { cn } from "@/lib/utils";

type EventStatus = "open" | "few_left" | "closed";

type EventStatusLabelProps = {
  status: EventStatus;
  className?: string;
};

const statusConfig: Record<
  EventStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  open: {
    label: "受付中",
    bgClass: "bg-[#85B7EB]",
    textClass: "text-[#1E2C10]",
  },
  few_left: {
    label: "残りわずか",
    bgClass: "bg-[#FAC775]",
    textClass: "text-[#77471C]",
  },
  closed: {
    label: "開催終了",
    bgClass: "bg-[rgba(5,5,5,0.1)] border border-[#838C7D]",
    textClass: "text-[#838C7D]",
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
