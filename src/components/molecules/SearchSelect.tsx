"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  matchesRegionOption,
  type RegionOption,
  type RegionOptionGroup,
} from "@/utils/regionSearch";
import { Check, ChevronDown, ChevronUp, Lock, Search, X } from "lucide-react";

type SearchSelectProps = {
  // 入力欄のID。ラベルとの関連付けに使う
  id: string;
  // 選択中の項目名。未選択は空文字
  value: string;
  // 候補のグループ（検索前の全件）
  groups: readonly RegionOptionGroup[];
  onChange: (option: RegionOption) => void;
  // クリアボタン押下時。指定しないとクリアボタンを表示しない
  onClear?: () => void;
  placeholder: string;
  // disabled 時に表示するプレースホルダー
  disabledPlaceholder?: string;
  disabled?: boolean;
  error?: boolean;
  // 候補が0件のときの文言の「種類」（例:「都道府県」「市区町村」）
  emptyLabel: string;
  // 市区町村のように、見出しの横に件数を表示するか
  showCount?: boolean;
  ariaLabel?: string;
};

// 検索付きの単一選択ドロップダウン。
// 入力欄と候補リストを一体化し、検索・キーボード操作・ARIA 対応を含めて閉じている。
export function SearchSelect({
  id,
  value,
  groups,
  onChange,
  onClear,
  placeholder,
  disabledPlaceholder,
  disabled = false,
  error = false,
  emptyLabel,
  showCount = false,
  ariaLabel,
}: Readonly<SearchSelectProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = `${id}-listbox`;
  const optionBaseId = useId();

  // 候補を閉じたときに、入力値を選択中の項目名へ戻す
  useEffect(() => {
    if (!isOpen) {
      setQuery(value);
      setHighlightedIndex(0);
    }
  }, [isOpen, value]);

  // コンポーネント外のクリックで候補を閉じる
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // 入力値で候補を絞り込む。入力値が空なら全件を表示する
  const filteredGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          options: group.options.filter((option) =>
            matchesRegionOption(option, query),
          ),
        }))
        .filter((group) => group.options.length > 0),
    [groups, query],
  );

  // キーボード操作と ARIA のための、グループを平坦化した候補一覧
  const flatOptions = useMemo(
    () => filteredGroups.flatMap((group) => group.options),
    [filteredGroups],
  );

  // 各グループの先頭要素が全候補中の何番目かを求める
  const groupStartIndices = useMemo(() => {
    let acc = 0;
    return filteredGroups.map((group) => {
      const start = acc;
      acc += group.options.length;
      return start;
    });
  }, [filteredGroups]);

  // 件数表示に使う検索前の全候補数
  const totalCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.options.length, 0),
    [groups],
  );

  const showClear =
    Boolean(value) && !disabled && typeof onClear === "function";

  const openList = () => {
    if (disabled) {
      return;
    }
    setQuery("");
    setHighlightedIndex(0);
    setIsOpen(true);
  };

  const selectOption = (option: RegionOption) => {
    onChange(option);
    setQuery(option.name);
    setHighlightedIndex(0);
    setIsOpen(false);
  };

  const handleInputChange = (input: string) => {
    setQuery(input);
    setHighlightedIndex(0);
    setIsOpen(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        if (!isOpen) {
          openList();
        } else if (flatOptions.length > 0) {
          setHighlightedIndex((prev) => (prev + 1) % flatOptions.length);
        }
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        if (flatOptions.length > 0) {
          setHighlightedIndex(
            (prev) => (prev - 1 + flatOptions.length) % flatOptions.length,
          );
        }
        break;
      }
      case "Enter": {
        if (isOpen) {
          event.preventDefault();
          const option = flatOptions[highlightedIndex];
          if (option) {
            selectOption(option);
          }
        }
        break;
      }
      case "Escape": {
        event.preventDefault();
        setIsOpen(false);
        break;
      }
      case "Tab": {
        setIsOpen(false);
        break;
      }
      default:
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-white transition-colors",
          disabled
            ? "border-(--form-border) bg-slate-50"
            : error
              ? "border-rose-300 ring-2 ring-rose-100"
              : "border-(--form-border) focus-within:border-(--brand-green) focus-within:ring-2 focus-within:ring-(--brand-green)/30",
        )}
      >
        <span className="pointer-events-none flex shrink-0 items-center pl-3 text-slate-400">
          {disabled ? (
            <Lock aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Search aria-hidden="true" className="h-4 w-4" />
          )}
        </span>

        <input
          id={id}
          role="combobox"
          type="text"
          aria-haspopup="listbox"
          aria-expanded={disabled ? undefined : isOpen}
          aria-controls={disabled ? undefined : listboxId}
          aria-activedescendant={
            isOpen && flatOptions[highlightedIndex]
              ? `${optionBaseId}-option-${highlightedIndex}`
              : undefined
          }
          aria-invalid={error || undefined}
          aria-label={ariaLabel}
          value={query}
          disabled={disabled}
          placeholder={disabled ? disabledPlaceholder : placeholder}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => openList()}
          onClick={() => {
            if (!isOpen) {
              openList();
            }
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-11 w-full min-w-0 flex-1 bg-transparent pr-2 text-sm text-slate-900 outline-none placeholder:text-slate-400",
            disabled ? "cursor-not-allowed text-slate-400" : "cursor-text",
          )}
        />

        <span className="flex shrink-0 items-center pr-2 text-slate-400">
          {showClear ? (
            <button
              type="button"
              onClick={() => {
                onClear?.();
                setQuery("");
                setHighlightedIndex(0);
              }}
              aria-label="選択をクリア"
              className="cursor-pointer rounded p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : disabled ? null : isOpen ? (
            <ChevronUp aria-hidden="true" className="h-4 w-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          )}
        </span>
      </div>

      {isOpen && !disabled ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          {flatOptions.length === 0 ? (
            <div className="px-3 py-3 text-center text-sm text-slate-500">
              『{query.trim()}』に一致する{emptyLabel}がありません
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto p-1">
              {filteredGroups.map((group, groupIndex) => (
                <div key={group.groupLabel}>
                  <div
                    aria-hidden="true"
                    className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500"
                  >
                    <span>{group.groupLabel}</span>
                    {showCount ? (
                      <span className="text-slate-400">
                        {group.options.length} / {totalCount}件
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-0.5">
                    {group.options.map((option, optionIndex) => {
                      const index =
                        (groupStartIndices[groupIndex] ?? 0) + optionIndex;
                      const isHighlighted = index === highlightedIndex;
                      const isSelected = option.name === value;
                      return (
                        <div
                          key={option.name}
                          id={`${optionBaseId}-option-${index}`}
                          role="option"
                          aria-selected={isSelected}
                          tabIndex={-1}
                          onMouseDown={(event) => event.preventDefault()}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onClick={() => selectOption(option)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              selectOption(option);
                            }
                          }}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-lg py-2 pl-7 pr-3 text-sm",
                            isSelected
                              ? "font-bold text-(--brand-green-text)"
                              : "text-slate-800",
                            isHighlighted && "bg-(--brand-green)/10",
                          )}
                        >
                          {isSelected ? (
                            <Check
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 text-(--brand-green-text)"
                            />
                          ) : null}
                          <span className="min-w-0 truncate">
                            {option.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
