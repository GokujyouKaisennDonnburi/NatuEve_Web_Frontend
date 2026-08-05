"use client";

import { cn } from "@/lib/utils";

type PriceFilterProps = {
  freeOnly?: boolean;
  onFreeOnlyChange?: (free: boolean) => void;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  onMinPriceChange?: (price: number | undefined) => void;
  onMaxPriceChange?: (price: number | undefined) => void;
  className?: string;
};

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-4 h-4 rounded-[3px] border shrink-0",
        checked
          ? "bg-[#97C459] border-[#97C459]"
          : "bg-white border-[#CDD4C8]",
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

export function PriceFilter({
  freeOnly = false,
  onFreeOnlyChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  className,
}: Readonly<PriceFilterProps>) {
  return (
    <div className={cn("", className)}>
      <span className="block text-xs font-bold leading-[17px] text-[#838C7D] mb-2">
        参加費用
      </span>

      <button
        type="button"
        onClick={() => onFreeOnlyChange?.(!freeOnly)}
        className="flex items-center w-full h-[22px] bg-transparent px-[8px] text-left mb-2"
      >
        <Checkbox checked={freeOnly} />
        <span
          className={cn(
            "ml-[6px] text-sm leading-5 text-[#3A4237]",
            freeOnly ? "font-bold" : "font-normal",
          )}
        >
          無料のみ
        </span>
      </button>

      <div className="flex items-center h-[42px] bg-[#F8FAF6] border border-[#E3E8DF] rounded-[10px] overflow-scroll px-[13px]">
        <div className="flex-1 flex items-center gap-1">
          <input
            type="number"
            value={minPrice ?? ""}
            onChange={(e) =>
              onMinPriceChange?.(
                e.target.value === ""
                  ? undefined
                  : Number(e.target.value),
              )
            }
            placeholder="下限"
            className="w-[50px] h-[22px] bg-transparent border-none outline-none text-sm leading-5 text-[#757575] placeholder:text-[#757575] p-0"
          />
          <span className="text-sm leading-5 text-[#757575]">〜</span>
          <input
            type="number"
            value={maxPrice ?? ""}
            onChange={(e) =>
              onMaxPriceChange?.(
                e.target.value === ""
                  ? undefined
                  : Number(e.target.value),
              )
            }
            placeholder="上限なし"
            className="w-[70px] h-[22px] bg-transparent border-none outline-none text-sm leading-5 text-[#757575] placeholder:text-[#757575] p-0"
          />
        </div>
        <span className="text-[13px] leading-[19px] text-[#838C7D] shrink-0">
          円まで
        </span>
      </div>
    </div>
  );
}