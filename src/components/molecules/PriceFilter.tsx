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
        className={cn(
          "flex items-center w-full h-[22px] bg-white border border-[#CDD4C8] rounded-[6px] px-[12px] text-left mb-2",
          freeOnly && "border-[#97C459] bg-[#97C459]/10",
        )}
      >
        <span
          className={cn(
            "text-sm leading-5 text-[#3A4237] font-normal",
            freeOnly && "font-bold",
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