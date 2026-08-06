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

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-4 h-4 rounded-[3px] border shrink-0",
        checked ? "bg-[#97C459] border-[#97C459]" : "bg-white border-[#CDD4C8]",
      )}
    >
      {checked && (
        <svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

export function StatusFilter({
  selectedStatuses = [],
  onStatusChange,
  className,
}: Readonly<StatusFilterProps>) {
  const toggleStatus = (id: string) => {
    const isSelected = selectedStatuses.includes(id);
    let next: string[];

    if (isSelected) {
      next = selectedStatuses.filter((s) => s !== id);
      if (id === "closed") {
        next = next.filter((s) => s !== "hasReport");
      }
    } else {
      next = [...selectedStatuses, id];
      if (id === "hasReport" && !next.includes("closed")) {
        next.push("closed");
      }
    }

    onStatusChange?.(next);
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
              className="flex items-center w-full h-[22px] bg-transparent px-[8px] text-left"
            >
              <Checkbox checked={selectedStatuses.includes(option.id)} />
              <span
                className={cn(
                  "ml-[6px] text-sm leading-5 text-[#3A4237]",
                  selectedStatuses.includes(option.id)
                    ? "font-bold"
                    : "font-normal",
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
                  className="flex items-center w-full h-[22px] bg-transparent px-[8px] text-left ml-[32px]"
                >
                  <Checkbox checked={selectedStatuses.includes(child.id)} />
                  <span
                    className={cn(
                      "ml-[6px] text-sm leading-5 text-[#3A4237]",
                      selectedStatuses.includes(child.id)
                        ? "font-bold"
                        : "font-normal",
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
