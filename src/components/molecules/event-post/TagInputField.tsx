"use client";

import { Check, Plus } from "lucide-react";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { AddItemButton } from "@/components/atoms/AddItemButton";
import { FieldNote } from "@/components/atoms/FieldNote";
import { FormInput } from "@/components/atoms/FormInput";
import { TagChip } from "@/components/atoms/event-post/TagChip";
import { FormField } from "@/components/molecules/FormField";
import { MAX_TAG_COUNT, MAX_TAG_LENGTH } from "@/constants/config";
import { MESSAGES } from "@/constants/messages";
import { useCreateTag } from "@/hooks/useCreateTag";
import { useRowIds } from "@/hooks/useRowIds";
import { useTags } from "@/hooks/useTags";
import { TagError, TagErrorCode, type TagItem } from "@/types/tag";

type TagInputFieldProps = {
  id: string;
  tags: TagItem[];
  onTagsChange: (tags: TagItem[]) => void;
  error?: string;
};

const normalize = (value: string) => value.normalize("NFKC").toLowerCase();

export function TagInputField({
  id,
  tags,
  onTagsChange,
  error,
}: Readonly<TagInputFieldProps>) {
  const [draft, setDraft] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const { isSubmitting, submit } = useCreateTag();
  const { tags: allTags, isLoading: isTagsLoading } = useTags();
  const trimmedDraft = draft.trim();
  const normalizedDraft = normalize(trimmedDraft);
  // 追加済みタグとの重複は、大文字小文字や全角半角の違いを無視して判定する
  const normalizedTagNames = new Set(tags.map((t) => normalize(t.name)));
  const isDuplicate =
    trimmedDraft.length > 0 && normalizedTagNames.has(normalizedDraft);
  // 件数の上限はトーストで知らせるため、追加ボタンは無効化しない
  const isAddDisabled = !trimmedDraft || isDuplicate || isSubmitting;
  const helperId = `${id}-helper`;

  const latestTagsRef = useRef(tags);
  useEffect(() => {
    latestTagsRef.current = tags;
  }, [tags]);

  const { rowIds } = useRowIds(tags.length);

  const suggestions = normalizedDraft
    ? allTags.filter(
        (t) =>
          !normalizedTagNames.has(normalize(t.name)) &&
          normalize(t.name).includes(normalizedDraft),
      )
    : [];

  // 同名のタグが既にある場合は候補から選ばせたいので、新規作成の行は出さない
  const canCreate =
    trimmedDraft.length > 0 &&
    !isDuplicate &&
    !allTags.some((t) => normalize(t.name) === normalizedDraft);

  // 件数の上限に達しているかを判定し、達していればトーストで知らせる。
  // 同じ id を渡してトーストを積み上げず 1 件に保つ。
  const rejectWhenCountExceeded = () => {
    if (latestTagsRef.current.length >= MAX_TAG_COUNT) {
      toast.error(MESSAGES.TAG_COUNT_EXCEEDED, { id: `${id}-tag-count` });
      return true;
    }
    return false;
  };

  // 候補の末尾に新規作成の行を足したものを、まとめて1つのリストとして扱う
  const createIndex = canCreate ? suggestions.length : -1;
  const optionCount = suggestions.length + (canCreate ? 1 : 0);
  const showDropdown = isOpen && optionCount > 0;

  const handleAdd = async () => {
    if (isAddDisabled || rejectWhenCountExceeded()) {
      return;
    }
    const name = trimmedDraft;
    try {
      const created = await submit(name);
      onTagsChange([
        ...latestTagsRef.current,
        { id: created.id, name: created.name },
      ]);
      setDraft("");
      setIsOpen(false);
      setHighlightIndex(-1);
    } catch (caughtError) {
      if (
        caughtError instanceof TagError &&
        caughtError.code === TagErrorCode.DuplicateTag
      ) {
        const existing = allTags.find(
          (t) => normalize(t.name) === normalize(name),
        );
        if (existing) {
          onTagsChange([...latestTagsRef.current, existing]);
          setDraft("");
          setIsOpen(false);
          setHighlightIndex(-1);
        }
        return;
      }
      console.error("タグの作成に失敗しました。", caughtError);
      toast.error(
        caughtError instanceof Error
          ? caughtError.message
          : "タグの作成に失敗しました。時間をおいて再度お試しください。",
      );
    }
  };

  const handleSuggestionSelect = (tag: TagItem) => {
    if (rejectWhenCountExceeded()) {
      return;
    }
    onTagsChange([...latestTagsRef.current, tag]);
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
      if (showDropdown && highlightIndex >= 0 && highlightIndex < optionCount) {
        if (highlightIndex === createIndex) {
          void handleAdd();
        } else {
          handleSuggestionSelect(suggestions[highlightIndex]);
        }
        return;
      }
      void handleAdd();
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

  const handleDraftChange = (value: string) => {
    // maxLength で黙って切り詰めず、上限に触れた理由をトーストで伝える
    if (value.length > MAX_TAG_LENGTH) {
      toast.error(MESSAGES.TAG_LENGTH_EXCEEDED, { id: `${id}-tag-length` });
    }

    const nextDraft = value.slice(0, MAX_TAG_LENGTH);
    setDraft(nextDraft);
    setIsOpen(nextDraft.trim().length > 0);
    setHighlightIndex(-1);
  };

  const containerRef = useRef<HTMLDivElement>(null);
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

  const handleRemove = (index: number) => {
    onTagsChange(tags.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <FormField id={id} label="タグ" required error={error}>
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="追加済みのタグ">
          {tags.map((tag, index) => (
            <li key={rowIds[index] ?? `${id}-tag-${index}`}>
              <TagChip label={tag.name} onRemove={() => handleRemove(index)} />
            </li>
          ))}
        </ul>
      ) : null}

      <div ref={containerRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FormInput
              id={id}
              value={draft}
              onChange={(event) => handleDraftChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (trimmedDraft.length > 0) {
                  setIsOpen(true);
                }
              }}
              placeholder="タグを入力（例: 野鳥）"
              disabled={isSubmitting}
              aria-invalid={Boolean(error) || isDuplicate}
              aria-describedby={isDuplicate ? helperId : undefined}
              aria-expanded={showDropdown}
              aria-controls={`${id}-listbox`}
              aria-autocomplete="list"
              role="combobox"
            />

            {/* 候補は入力欄と同じ幅で下に開き、ウィンドウ幅の変化に追従させる */}
            {showDropdown ? (
              <div
                id={`${id}-listbox`}
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

                {canCreate ? (
                  <div
                    role="option"
                    aria-selected={highlightIndex === createIndex}
                    tabIndex={-1}
                    className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                      highlightIndex === createIndex
                        ? "bg-(--brand-green-soft) text-(--brand-green-text)"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                    onMouseDown={() => {
                      void handleAdd();
                    }}
                    onMouseEnter={() => setHighlightIndex(createIndex)}
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">「{trimmedDraft}」を追加</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {isTagsLoading &&
            trimmedDraft.length > 0 &&
            suggestions.length === 0 ? (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
                読み込み中…
              </div>
            ) : null}
          </div>

          <AddItemButton
            onClick={() => {
              void handleAdd();
            }}
            disabled={isAddDisabled}
            className="h-11 shrink-0"
          >
            {isSubmitting ? "追加中…" : "追加"}
          </AddItemButton>
        </div>
      </div>

      {isDuplicate ? (
        <FieldNote tone="error">
          <span id={helperId}>「{trimmedDraft}」は既に追加されています。</span>
        </FieldNote>
      ) : null}
    </FormField>
  );
}
