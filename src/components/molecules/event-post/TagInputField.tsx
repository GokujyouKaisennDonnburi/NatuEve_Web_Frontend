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
import { normalizeTagName } from "@/lib/utils";
import { TagError, TagErrorCode, type TagItem } from "@/types/tag";

type TagInputFieldProps = {
  id: string;
  tags: TagItem[];
  onTagsChange: (tags: TagItem[]) => void;
  error?: string;
};

export function TagInputField({
  id,
  tags,
  onTagsChange,
  error,
}: Readonly<TagInputFieldProps>) {
  const [draft, setDraft] = useState("");
  // 作成 API の往復だけでなく、409 後に一覧を取り直す間も操作を止めたい。
  // useCreateTag の isSubmitting は作成 API が終わった時点で false に戻るため、
  // リカバリまで含めた「追加処理中」はこちらで持つ。
  const [isAdding, setIsAdding] = useState(false);
  const { isSubmitting, submit } = useCreateTag();
  const {
    tags: allTags,
    isLoading: isTagsLoading,
    addTag,
    refetch: refetchTags,
  } = useTags();
  const trimmedDraft = draft.trim();
  const normalizedDraft = normalizeTagName(trimmedDraft);
  // 追加済みタグとの重複は、大文字小文字や全角半角の違いを無視して判定する
  const normalizedTagNames = new Set(tags.map((t) => normalizeTagName(t.name)));
  const isDuplicate =
    trimmedDraft.length > 0 && normalizedTagNames.has(normalizedDraft);
  const isBusy = isSubmitting || isAdding;
  // 件数の上限はトーストで知らせるため、追加ボタンは無効化しない
  const isAddDisabled = !trimmedDraft || isDuplicate || isBusy;
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
    !allTags.some((t) => normalizeTagName(t.name) === normalizedDraft);

  // 件数の上限に達しているかを判定し、達していればトーストで知らせる。
  // 同じ id を渡してトーストを積み上げず 1 件に保つ。
  const rejectWhenCountExceeded = () => {
    if (latestTagsRef.current.length >= MAX_TAG_COUNT) {
      toast.error(MESSAGES.TAG_COUNT_EXCEEDED, { id: `${id}-tag-count` });
      return true;
    }
    return false;
  };

  // 409 duplicate_tag のリカバリ。サーバーには存在するが手元の一覧に無いことがあるため、
  // 見つからなければ一覧を取り直してから探す。409 のレスポンスボディは
  // { error: { code, message } } のみで既存タグの id を含まないので、一覧から引くしかない。
  const addExistingTag = async (name: string) => {
    const normalizedName = normalizeTagName(name);
    // 正規化だけで照合すると、サーバーに正規化後は同じで表記の違うタグが複数ある場合に
    // 入力とは別のタグを拾いうる。完全一致があればそちらを優先する。
    const findExisting = (candidates: TagItem[]) =>
      candidates.find((t) => t.name === name) ??
      candidates.find((t) => normalizeTagName(t.name) === normalizedName);

    let existing = findExisting(allTags);
    if (!existing) {
      try {
        existing = findExisting(await refetchTags());
      } catch (caughtError) {
        console.error("タグ一覧の再取得に失敗しました。", caughtError);
      }
    }

    if (!existing) {
      toast.error(MESSAGES.TAG_ADD_FAILED);
      return;
    }

    // ここまでに await を挟んでいるので、追加可否は最新の tags でもう一度見る。
    // handleSuggestionSelect と同じ判定を通し、上限超過や重複をすり抜けさせない。
    if (rejectWhenCountExceeded()) {
      return;
    }
    const alreadyAdded = latestTagsRef.current.some(
      (t) => t.id === existing.id,
    );
    if (!alreadyAdded) {
      onTagsChange([...latestTagsRef.current, existing]);
    }
    setDraft("");
  };

  const handleAdd = async () => {
    if (isAddDisabled || rejectWhenCountExceeded()) {
      return;
    }
    const name = trimmedDraft;
    setIsAdding(true);
    try {
      const created = await submit(name);
      // 作成したタグを一覧にも反映する。これが無いと、追加 → 削除 → 同名を再追加したときに
      // 候補にも重複判定にも現れず、409 を踏んでから探し直すことになる。
      addTag(created);
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
        await addExistingTag(name);
        return;
      }
      console.error("タグの作成に失敗しました。", caughtError);
      toast.error(
        caughtError instanceof Error
          ? caughtError.message
          : MESSAGES.TAG_ADD_FAILED,
      );
    } finally {
      setIsAdding(false);
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
            disabled={isBusy}
            listboxId={`${id}-listbox`}
            renderInput={({
              value,
              onChange,
              onKeyDown,
              onFocus,
              showDropdown,
              listboxId,
              activeDescendantId,
            }) => (
              <FormInput
                id={id}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                placeholder="タグを入力（例: 野鳥）"
                disabled={isBusy}
                aria-invalid={Boolean(error) || isDuplicate}
                aria-describedby={isDuplicate ? helperId : undefined}
                aria-expanded={showDropdown}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={activeDescendantId}
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
          {isBusy ? "追加中…" : "追加"}
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
