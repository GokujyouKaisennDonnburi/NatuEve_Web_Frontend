"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AddItemButton } from "@/components/atoms/AddItemButton";
import { FieldNote } from "@/components/atoms/FieldNote";
import { FormInput } from "@/components/atoms/FormInput";
import { TagChip } from "@/components/atoms/event-post/TagChip";
import { FormField } from "@/components/molecules/FormField";
import { TagAutocomplete } from "@/components/molecules/TagAutocomplete";
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

  const { rowIds, removeRowId } = useRowIds(tags.length);

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
      return false;
    }
    onTagsChange([...latestTagsRef.current, tag]);
    setDraft("");
    return true;
  };

  const handleDraftChange = (value: string) => {
    // maxLength で黙って切り詰めず、上限に触れた理由をトーストで伝える
    if (value.length > MAX_TAG_LENGTH) {
      toast.error(MESSAGES.TAG_LENGTH_EXCEEDED, { id: `${id}-tag-length` });
    }

    setDraft(value.slice(0, MAX_TAG_LENGTH));
  };

  const handleRemove = (index: number) => {
    // 削除した位置の ID も落とす。件数の変化だけに任せると末尾が切り詰められ、
    // 中間を削除したときに以降のタグと ID の対応がずれる。
    removeRowId(index);
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

      <div className="flex gap-2">
        <div className="relative flex-1">
          <TagAutocomplete
            allTags={allTags}
            selectedIds={tags.map((t) => t.id)}
            value={draft}
            onValueChange={handleDraftChange}
            onSelect={handleSuggestionSelect}
            onCreate={handleAdd}
            canCreate={canCreate}
            isLoading={isTagsLoading}
            listboxId={`${id}-listbox`}
            renderInput={({
              value,
              onChange,
              onKeyDown,
              onFocus,
              showDropdown,
              listboxId,
            }) => (
              <FormInput
                id={id}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                placeholder="タグを入力（例: 野鳥）"
                disabled={isSubmitting}
                aria-invalid={Boolean(error) || isDuplicate}
                aria-describedby={isDuplicate ? helperId : undefined}
                aria-expanded={showDropdown}
                aria-controls={listboxId}
                aria-autocomplete="list"
                role="combobox"
              />
            )}
          />
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

      {isDuplicate ? (
        <FieldNote tone="error">
          <span id={helperId}>「{trimmedDraft}」は既に追加されています。</span>
        </FieldNote>
      ) : null}
    </FormField>
  );
}
