"use client";

import { Check } from "lucide-react";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { FilterTag } from "@/components/atoms/FilterTag";
import { cn } from "@/lib/utils";
import type { TagItem } from "@/types/tag";

type TagFilterProps = {
  allTags: TagItem[];
  selectedIds?: string[];
  onTagSelect?: (id: string) => void;
  className?: string;
};

const normalize = (value: string) => value.normalize("NFKC").toLowerCase();

export function TagFilter({
  allTags,
  selectedIds = [],
  onTagSelect,
  className,
}: Readonly<TagFilterProps>) {
  const [draft, setDraft] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmedDraft = draft.trim();
  const normalizedDraft = normalize(trimmedDraft);

  // 入力値で全タグから候補を絞り込む。選択済み・一覧にないタグは候補に含めない。
  const suggestions = normalizedDraft
    ? allTags.filter(
        (tag) =>
          !selectedIds.includes(tag.id) &&
          normalize(tag.name).includes(normalizedDraft),
      )
    : [];

  const showDropdown = isOpen && suggestions.length > 0;

  const handleSuggestionSelect = (tag: TagItem) => {
    onTagSelect?.(tag.id);
    setDraft("");
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (event.nativeEvent.isComposing) {
        return;
      }
      event.preventDefault();
      if (
        showDropdown &&
        highlightIndex >= 0 &&
        highlightIndex < suggestions.length
      ) {
        handleSuggestionSelect(suggestions[highlightIndex]);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightIndex(-1);
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    setIsOpen(value.trim().length > 0);
    setHighlightIndex(-1);
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
      setHighlightIndex(-1);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const selectedTags = selectedIds
    .map((id) => allTags.find((tag) => tag.id === id))
    .filter((tag): tag is TagItem => tag != null);

  return (
    <div className={cn("", className)}>
      <span className="block text-xs font-bold leading-[17px] text-[#838C7D] mb-2">
        タグ
      </span>

      <div ref={containerRef} className="relative">
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
            value={draft}
            onChange={(event) => handleDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (trimmedDraft.length > 0) {
                setIsOpen(true);
              }
            }}
            placeholder="タグを検索（例: 双眼鏡）"
            className="flex-1 h-[22px] ml-[8px] mr-[13px] bg-transparent border-none outline-none text-sm leading-5 text-[#757575] placeholder:text-[#757575] p-0"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="tag-filter-listbox"
            aria-autocomplete="list"
          />
        </div>

        {/* 候補は入力欄と同じ幅で下に開く */}
        {showDropdown ? (
          <div
            id="tag-filter-listbox"
            role="listbox"
            aria-label="タグ候補"
            className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                role="option"
                aria-selected={index === highlightIndex}
                tabIndex={-1}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                  index === highlightIndex
                    ? "bg-(--brand-green-soft) text-(--brand-green-text)"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
                onMouseDown={() => handleSuggestionSelect(suggestion)}
                onMouseEnter={() => setHighlightIndex(index)}
              >
                <span className="truncate">{suggestion.name}</span>
                {index === highlightIndex ? (
                  <Check className="h-3.5 w-3.5 shrink-0" />
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

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
