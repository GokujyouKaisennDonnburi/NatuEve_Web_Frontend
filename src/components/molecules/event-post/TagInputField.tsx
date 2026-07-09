import { Plus } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import { FieldNote } from "@/components/atoms/event-post/FieldNote";
import { TagChip } from "@/components/atoms/event-post/TagChip";
import { FormField } from "@/components/molecules/event-post/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_TAG_COUNT, MAX_TAG_LENGTH } from "@/constants/config";

// タグ入力欄コンポーネントのプロパティを定義。
// タグ配列は親コンポーネントで管理する controlled 設計とし、
// バリデーション(重複・空文字・文字数・件数)は page.tsx の validate() に集約する。
type TagInputFieldProps = {
  id: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  error?: string;
};

// タグ入力欄を表示するコンポーネント。
// Input にタグ名を入力し、Enter または追加ボタンで確定する。
// 既存タグは Badge 風チップとして表示し、× ボタンで削除できる。
export function TagInputField({
  id,
  tags,
  onTagsChange,
  error,
}: Readonly<TagInputFieldProps>) {
  const [draft, setDraft] = useState(""); // 入力中のタグ文字列
  const isLimitReached = tags.length >= MAX_TAG_COUNT; // 件数上限に達したか
  // 入力中のタグを正規化し、空文字以外で既存タグと重複しているかを判定する。
  // ボタンの disabled と Enter キー処理の両方で利用する。
  const trimmedDraft = draft.trim();
  const isDuplicate = trimmedDraft.length > 0 && tags.includes(trimmedDraft);
  const isAddDisabled = !trimmedDraft || isLimitReached || isDuplicate;

  // タグ追加処理。空文字・空白のみ・重複の場合は追加しない。
  // 文字数・件数上限の最終的な検証は親 validate() に集約する。
  const handleAdd = () => {
    if (isAddDisabled) {
      return;
    }
    onTagsChange([...tags, trimmedDraft]);
    setDraft("");
  };

  // Enter 押下で追加する。IME 変換中の Enter は誤発火防止のため除外する。
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }
    if (event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    handleAdd();
  };

  // インデックス指定でタグを削除する。
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
      {/* タグ入力と追加ボタンのセクション */}
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="例: 自然観察"
          maxLength={MAX_TAG_LENGTH}
          disabled={isLimitReached}
          aria-invalid={Boolean(error)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={isAddDisabled}
          className="shrink-0 cursor-pointer"
          title={
            isDuplicate
              ? "同じタグが既に追加されています"
              : isLimitReached
                ? `タグは最大${MAX_TAG_COUNT}件まで追加できます`
                : undefined
          }
        >
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </div>

      {/* 追加済みタグの表示。0 件のときはプレースホルダーを表示する。 */}
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="追加済みのタグ">
          {tags.map((tag, index) => (
            <li key={tag}>
              <TagChip label={tag} onRemove={() => handleRemove(index)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          タグが未設定です。必要に応じて追加してください。
        </div>
      )}

      {/* 件数上限到達時の注意書き */}
      {isLimitReached ? (
        <FieldNote>タグは最大{MAX_TAG_COUNT}件まで追加できます。</FieldNote>
      ) : null}
    </FormField>
  );
}
