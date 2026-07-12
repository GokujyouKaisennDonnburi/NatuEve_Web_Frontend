"use client";

import { Check, Loader2, Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { toast } from "sonner";

import { FieldNote } from "@/components/atoms/event-post/FieldNote";
import { TagChip } from "@/components/atoms/event-post/TagChip";
import { FormField } from "@/components/molecules/event-post/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_TAG_COUNT, MAX_TAG_LENGTH } from "@/constants/config";
import { useCreateTag } from "@/hooks/useCreateTag";
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
  const isLimitReached = tags.length >= MAX_TAG_COUNT;
  const trimmedDraft = draft.trim();
  const isDuplicate =
    trimmedDraft.length > 0 && tags.some((t) => t.name === trimmedDraft);
  const isAddDisabled =
    !trimmedDraft || isLimitReached || isDuplicate || isSubmitting;
  const helperId = `${id}-helper`;

  const latestTagsRef = useRef(tags);
  useEffect(() => {
    latestTagsRef.current = tags;
  }, [tags]);

  const [rowIds, setRowIds] = useState<string[]>(() =>
    tags.map(() => crypto.randomUUID()),
  );

  useEffect(() => {
    setRowIds((current) => {
      if (current.length === tags.length) {
        return current;
      }
      if (current.length < tags.length) {
        return [
          ...current,
          ...Array.from({ length: tags.length - current.length }, () =>
            crypto.randomUUID(),
          ),
        ];
      }
      return current.slice(0, tags.length);
    });
  }, [tags.length]);

  const existingNames = new Set(tags.map((t) => t.name));
  const normalizedDraft = normalize(trimmedDraft);
  const suggestions = normalizedDraft
    ? allTags.filter(
        (t) =>
          !existingNames.has(t.name) &&
          normalize(t.name).includes(normalizedDraft),
      )
    : [];

  const showDropdown = isOpen && suggestions.length > 0;

  const handleAdd = async () => {
    if (isAddDisabled) {
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
    } catch (caughtError) {
      if (
        caughtError instanceof TagError &&
        caughtError.code === TagErrorCode.DuplicateTag
      ) {
        const existing = allTags.find((t) => t.name === name);
        if (existing) {
          onTagsChange([...latestTagsRef.current, existing]);
          setDraft("");
          setIsOpen(false);
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
      if (showDropdown && highlightIndex >= 0) {
        handleSuggestionSelect(suggestions[highlightIndex]);
        return;
      }
      void handleAdd();
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
    <FormField
      id={id}
      label="タグ"
      hint={`検索や絞り込みで使います。1タグ最大${MAX_TAG_LENGTH}文字・最大${MAX_TAG_COUNT}件まで。`}
      error={error}
    >
      <div ref={containerRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id={id}
              value={draft}
              onChange={(event) => handleDraftChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (trimmedDraft.length > 0) {
                  setIsOpen(true);
                }
              }}
              placeholder="例: 自然観察"
              maxLength={MAX_TAG_LENGTH}
              disabled={isLimitReached || isSubmitting}
              aria-invalid={Boolean(error) || isDuplicate}
              aria-describedby={isDuplicate ? helperId : undefined}
              aria-expanded={showDropdown}
              aria-controls={`${id}-listbox`}
              aria-autocomplete="list"
              role="combobox"
            />

            {showDropdown ? (
              <div
                id={`${id}-listbox`}
                role="listbox"
                aria-label="タグ候補"
                className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg"
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    role="option"
                    aria-selected={index === highlightIndex}
                    tabIndex={-1}
                    className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                      index === highlightIndex
                        ? "bg-teal-50 text-teal-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                    onMouseDown={() => handleSuggestionSelect(suggestion)}
                    onMouseEnter={() => setHighlightIndex(index)}
                  >
                    <span>{suggestion.name}</span>
                    {index === highlightIndex ? (
                      <Check className="h-3.5 w-3.5 shrink-0" />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {isTagsLoading &&
            trimmedDraft.length > 0 &&
            suggestions.length === 0 ? (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
                読み込み中…
              </div>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void handleAdd();
            }}
            disabled={isAddDisabled}
            className="shrink-0 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            追加
          </Button>
        </div>
      </div>

      {isDuplicate ? (
        <FieldNote tone="error">
          <span id={helperId}>「{trimmedDraft}」は既に追加されています。</span>
        </FieldNote>
      ) : null}

      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="追加済みのタグ">
          {tags.map((tag, index) => (
            <li key={rowIds[index] ?? `${id}-tag-${index}`}>
              <TagChip label={tag.name} onRemove={() => handleRemove(index)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          タグが未設定です。必要に応じて追加してください。
        </div>
      )}

      {isLimitReached ? (
        <FieldNote>タグは最大{MAX_TAG_COUNT}件まで追加できます。</FieldNote>
      ) : null}
    </FormField>
  );
}
