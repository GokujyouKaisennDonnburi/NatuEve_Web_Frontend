"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { FilterTag } from "@/components/atoms/FilterTag";
import { TagAutocomplete } from "@/components/molecules/TagAutocomplete";
import { cn } from "@/lib/utils";
import type { TagItem } from "@/types/tag";

type TagFilterProps = {
  allTags: TagItem[];
  frequentTags: TagItem[];
  selectedIds?: string[];
  onTagSelect?: (id: string) => void;
  className?: string;
};

export function TagFilter({
  allTags,
  frequentTags,
  selectedIds = [],
  onTagSelect,
  className,
}: Readonly<TagFilterProps>) {
  const [draft, setDraft] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || isExpanded) return;
    let visibleCount = 0;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      if (child.offsetTop < 76) {
        visibleCount++;
      }
    }
    setHiddenCount(frequentTags.length - visibleCount);
  }, [frequentTags, isExpanded]);

  const selectedTags = selectedIds
    .map((id) => allTags.find((tag) => tag.id === id))
    .filter((tag): tag is TagItem => tag != null);

  return (
    <div className={cn("", className)}>
      <span className="block text-xs font-bold leading-[17px] text-[#838C7D] mb-2">
        タグ
      </span>

      <TagAutocomplete
        allTags={allTags}
        selectedIds={selectedIds}
        value={draft}
        onValueChange={setDraft}
        onSelect={(tag) => {
          onTagSelect?.(tag.id);
          return true;
        }}
        listboxId="tag-filter-listbox"
        renderInput={({
          value,
          onChange,
          onKeyDown,
          onFocus,
          showDropdown,
          listboxId,
        }) => (
          <div className="flex items-center h-[42px] bg-[#F8FAF6] border border-[#E3E8DF] rounded-[10px] overflow-hidden">
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
              value={value}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              placeholder="タグを検索（例: 双眼鏡）"
              className="flex-1 h-[22px] ml-[8px] mr-[13px] bg-transparent border-none outline-none text-sm leading-5 text-[#757575] placeholder:text-[#757575] p-0"
              role="combobox"
              aria-expanded={showDropdown}
              aria-controls={listboxId}
              aria-autocomplete="list"
            />
          </div>
        )}
      />

      {/* よく使うタグ */}
      {frequentTags.length > 0 ? (
        <>
          <span className="block text-[11px] font-bold leading-4 text-[#A8B1A2] mt-4 mb-2">
            よく使うタグ
          </span>

          <div
            ref={containerRef}
            className={cn(
              "relative flex flex-wrap gap-2 mb-1 overflow-hidden",
              !isExpanded && "max-h-[76px]",
            )}
          >
            {frequentTags.map((tag) => (
              <FilterTag
                key={tag.id}
                label={tag.name}
                size="md"
                selected={selectedIds.includes(tag.id)}
                onClick={onTagSelect ? () => onTagSelect(tag.id) : undefined}
              />
            ))}
          </div>

          {(hiddenCount > 0 || isExpanded) && (
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
      ) : null}

      {/* 選択済みタグ */}
      {selectedTags.length > 0 ? (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedTags.map((tag) => (
            <FilterTag
              key={tag.id}
              label={tag.name}
              size="md"
              selected
              onClick={onTagSelect ? () => onTagSelect(tag.id) : undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
