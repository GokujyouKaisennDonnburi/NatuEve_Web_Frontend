"use client";

import { cn } from "@/lib/utils";

type StatusFilterProps = {
  selectedStatuses?: string[];
  onStatusChange?: (statuses: string[]) => void;
  className?: string;
};

const STATUS_OPTIONS = [
  { id: "upcoming", label: "開催前" },
  { id: "closed", label: "開催終了" },
] as const;

const CHILD_OPTIONS = [
  { id: "hasReport", label: "レポートあり", parentId: "closed" },
] as const;

export function StatusFilter({
  selectedStatuses = [],
  onStatusChange,
  className,
}: Readonly<StatusFilterProps>) {
  const toggleStatus = (id: string) => {
    const next = selectedStatuses.includes(id)
      ? selectedStatuses.filter((s) => s !== id)
      : [...selectedStatuses, id];

    if (id === "closed" && !next.includes("closed")) {
      onStatusChange?.(next.filter((s) => s !== "hasReport"));
    } else {
      onStatusChange?.(next);
    }
  };

  return (
    <div className={cn("", className)}>
      <span className="block text-xs font-bold leading-[17px] text-[#838C7D] mb-2">
        開催状況
      </span>

      <div className="space-y-[2px]">
        {STATUS_OPTIONS.map((option) => (
          <div key={option.id}>
            <button
              type="button"
              onClick={() => toggleStatus(option.id)}
              className={cn(
                "flex items-center w-full h-[22px] bg-white border border-[#CDD4C8] rounded-[6px] px-[12px] text-left",
                selectedStatuses.includes(option.id) &&
                  "border-[#97C459] bg-[#97C459]/10",
              )}
            >
              <span
                className={cn(
                  "text-sm leading-5 text-[#3A4237] font-normal",
                  selectedStatuses.includes(option.id) && "font-bold",
                )}
              >
                {option.label}
              </span>
            </button>

            {option.id === "closed" &&
              CHILD_OPTIONS.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => toggleStatus(child.id)}
                  className={cn(
                    "flex items-center w-full h-[22px] bg-white border border-[#CDD4C8] rounded-[6px] px-[12px] text-left ml-[32px] mt-[2px]",
                    selectedStatuses.includes(child.id) &&
                      "border-[#97C459] bg-[#97C459]/10",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm leading-5 text-[#3A4237] font-normal",
                      selectedStatuses.includes(child.id) &&
                        "font-bold",
                    )}
                  >
                    {child.label}
                  </span>
                </button>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}