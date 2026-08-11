"use client";

import { Check, Plus } from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";
import type { TagItem } from "@/types/tag";

type TagAutocompleteRenderInputProps = {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  showDropdown: boolean;
  listboxId: string;
  activeDescendantId: string | undefined;
};

type TagAutocompleteProps = {
  allTags: TagItem[];
  selectedIds: string[];
  value: string;
  onValueChange: (value: string) => void;
  // 候補選択時。追加が受け付けられなかった場合（上限超過など）は false を返し、
  // 入力値をクリアしないよう呼び出し側へ伝える。
  onSelect: (tag: TagItem) => boolean;
  onCreate?: (trimmedDraft: string) => void;
  canCreate?: boolean;
  isLoading?: boolean;
  listboxId?: string;
  className?: string;
  renderInput: (props: TagAutocompleteRenderInputProps) => ReactNode;
};

const normalize = (value: string) => value.normalize("NFKC").toLowerCase();

// タグ入力のオートコンプリート（入力欄+候補ドロップダウン+キーボード操作+クリック外出力閉じ処理）。
//
// 投稿画面の TagInputField とイベント一覧の絞り込み TagFilter で共通するため切り出した。
// 入力欄の見た目は renderInput で親に委ね、選択済みタグのチップや新規作成の副作用は親で持つ。
export function TagAutocomplete({
  allTags,
  selectedIds,
  value,
  onValueChange,
  onSelect,
  onCreate,
  canCreate = false,
  isLoading = false,
  listboxId = "tag-autocomplete-listbox",
  className,
  renderInput,
}: Readonly<TagAutocompleteProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmedDraft = value.trim();
  const normalizedDraft = normalize(trimmedDraft);

  // 入力値で全タグから候補を絞り込む。選択済みのタグは候補に含めない。
  const suggestions = normalizedDraft
    ? allTags.filter(
        (tag) =>
          !selectedIds.includes(tag.id) &&
          normalize(tag.name).includes(normalizedDraft),
      )
    : [];

  const hasCreateAction = canCreate && onCreate != null;
  const createIndex = hasCreateAction ? suggestions.length : -1;
  const optionCount = suggestions.length + (hasCreateAction ? 1 : 0);
  const showDropdown = isOpen && optionCount > 0;

  const handleSuggestionSelect = (tag: TagItem) => {
    // 上限超過などで受け付けられなかった場合は入力値を保持する
    if (!onSelect(tag)) {
      return;
    }
    onValueChange("");
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleCreate = () => {
    onCreate?.(trimmedDraft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (event.nativeEvent.isComposing) {
        return;
      }
      event.preventDefault();
      if (showDropdown && highlightIndex >= 0 && highlightIndex < optionCount) {
        if (highlightIndex === createIndex) {
          handleCreate();
        } else {
          handleSuggestionSelect(suggestions[highlightIndex]);
        }
        return;
      }

      // 入力が既存タグと完全一致するか、候補が1つだけなら自動選択
      const exactMatch = suggestions.find(
        (s) => normalize(s.name) === normalizedDraft,
      );
      if (exactMatch) {
        handleSuggestionSelect(exactMatch);
        return;
      }
      if (suggestions.length === 1) {
        handleSuggestionSelect(suggestions[0]);
        return;
      }

      handleCreate();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev < optionCount - 1 ? prev + 1 : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : optionCount - 1));
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightIndex(-1);
    }
  };

  const handleDraftChange = (nextValue: string) => {
    onValueChange(nextValue);
    setIsOpen(nextValue.trim().length > 0);
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

  const activeOptionId =
    showDropdown && highlightIndex >= 0
      ? highlightIndex === createIndex
        ? `${listboxId}-option-create`
        : `${listboxId}-option-${highlightIndex}`
      : undefined;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {renderInput({
        value,
        onChange: (event) => handleDraftChange(event.target.value),
        onKeyDown: handleKeyDown,
        onFocus: () => {
          if (trimmedDraft.length > 0) {
            setIsOpen(true);
          }
        },
        showDropdown,
        listboxId,
        activeDescendantId: activeOptionId,
      })}

      {/* 候補は入力欄と同じ幅で下に開く */}
      {showDropdown ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="タグ候補"
          className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              id={`${listboxId}-option-${index}`}
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

          {hasCreateAction ? (
            <div
              id={`${listboxId}-option-create`}
              role="option"
              aria-selected={highlightIndex === createIndex}
              tabIndex={-1}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                highlightIndex === createIndex
                  ? "bg-(--brand-green-soft) text-(--brand-green-text)"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
              onMouseDown={handleCreate}
              onMouseEnter={() => setHighlightIndex(createIndex)}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">「{trimmedDraft}」を追加</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {isLoading && trimmedDraft.length > 0 && suggestions.length === 0 ? (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
          読み込み中…
        </div>
      ) : null}
    </div>
  );
}
