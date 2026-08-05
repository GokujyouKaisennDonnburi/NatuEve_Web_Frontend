"use client";

import { FilterTag } from "@/components/atoms/FilterTag";
import { cn } from "@/lib/utils";
import type { TagItem } from "@/types/tag";
import { useState } from "react";

type TagFilterProps = {
  tags: TagItem[];
  selectedIds?: string[];
  onTagSelect?: (id: string) => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  maxVisible?: number;
  className?: string;
};

export function TagFilter({
  tags,
  selectedIds = [],
  onTagSelect,
  onSearch,
  searchQuery = "",
  maxVisible = 6,
  className,
}: Readonly<TagFilterProps>) {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleTags = isExpanded ? tags : tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  return (
    <div className={cn("", className)}>
      <label className="block text-xs font-bold leading-[17px] text-[#838C7D] mb-2">
        タグ
      </label>

      <div className="flex items-center h-[42px] bg-[#F8FAF6] border border-[#E3E8DF] rounded-[10px] overflow-hidden mb-4">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="shrink-0 ml-[13px]"
        >
          <circle
            cx="11"
            cy="11"
            r="6"
            stroke="#A8B1A2"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          <line
            x1="16.5"
            y1="16.5"
            x2="20"
            y2="20"
            stroke="#A8B1A2"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder="タグを検索（例: 双眼鏡）"
          className="flex-1 h-[22px] ml-[8px] mr-[13px] bg-transparent border-none outline-none text-sm leading-5 text-[#757575] placeholder:text-[#757575] p-0"
        />
      </div>

      {tags.length > 0 && (
        <>
          <span className="block text-[11px] font-bold leading-4 text-[#A8B1A2] mb-2">
            よく使うタグ
          </span>

          <div className="flex flex-wrap gap-2 mb-1">
            {visibleTags.map((tag) => (
              <FilterTag
                key={tag.id}
                label={tag.name}
                size="md"
                selected={selectedIds.includes(tag.id)}
                onClick={
                  onTagSelect ? () => onTagSelect(tag.id) : undefined
                }
              />
            ))}
          </div>

          {tags.length > maxVisible && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="text-[13px] font-bold leading-[19px] text-[#3868A3] hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              {isExpanded
                ? "− 閉じる"
                : `＋ もっと見る（残り${hiddenCount}個）`}
            </button>
          )}
        </>
      )}
    </div>
  );
}