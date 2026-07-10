import { Loader2, Plus } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";

import { FieldNote } from "@/components/atoms/event-post/FieldNote";
import { TagChip } from "@/components/atoms/event-post/TagChip";
import { FormField } from "@/components/molecules/event-post/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_TAG_COUNT, MAX_TAG_LENGTH } from "@/constants/config";
import { useCreateTag } from "@/hooks/useCreateTag";
import { TagError, TagErrorCode } from "@/types/tag";

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
// 確定時にバックエンドの POST /api/v1/tags を呼び出し、
// 成功時は API レスポンスの name を chip として追加する。
// 409 duplicate_tag はサーバ側に同名タグが存在する成功扱いのため、
// 通知を出さずローカルに追加する。
// 既存タグは Badge 風チップとして表示し、× ボタンで削除できる。
export function TagInputField({
  id,
  tags,
  onTagsChange,
  error,
}: Readonly<TagInputFieldProps>) {
  const [draft, setDraft] = useState(""); // 入力中のタグ文字列
  const { isSubmitting, submit } = useCreateTag();
  const isLimitReached = tags.length >= MAX_TAG_COUNT; // 件数上限に達したか
  // 入力中のタグを正規化し、空文字以外で既存タグと重複しているかを判定する。
  // ボタンの disabled と Enter キー処理の両方で利用する。
  const trimmedDraft = draft.trim();
  const isDuplicate = trimmedDraft.length > 0 && tags.includes(trimmedDraft);
  const isAddDisabled =
    !trimmedDraft || isLimitReached || isDuplicate || isSubmitting;
  // 重複エラーメッセージの id。aria-describedby で Input と関連付ける。
  const helperId = `${id}-helper`;

  // 通信中(await submit)中も親 tags が変わる可能性があるため、
  // 最新の tags を ref に保持しておき、await 完了後は ref から参照して更新する。
  // 古いクロージャの tags で上書きして削除等の更新を取りこぼすのを防ぐ目的。
  const latestTagsRef = useRef(tags);
  useEffect(() => {
    latestTagsRef.current = tags;
  }, [tags]);

  // 各行に安定した一意 key を割り当てるための ID 配列。タグ配列の長さに追従して
  // 追加/削除を再現する。万一の重複タグが入った場合の key 衝突を回避する目的。
  const [rowIds, setRowIds] = useState<string[]>(() =>
    tags.map(() => crypto.randomUUID()),
  );

  // tags の長さに追従して rowIds を更新する。並び替えは行わないため、
  // 中間削除時は index を維持したまま後ろ側の ID を破棄する。
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

  // タグ追加処理。POST /api/v1/tags を呼び出し、成功時に chip を追加する。
  // 文字数・件数上限の最終的な検証は親 validate() に集約する。
  // await 完了後はクロージャの tags ではなく latestTagsRef から最新値を
  // 読み出してマージする(通信中の削除を取りこぼさないため)。
  const handleAdd = async () => {
    if (isAddDisabled) {
      return;
    }
    const name = trimmedDraft;
    try {
      // 成功時はサーバが正規化／トリムした name を採用する。
      const created = await submit(name);
      onTagsChange([...latestTagsRef.current, created.name]);
      setDraft("");
    } catch (caughtError) {
      // 409 duplicate_tag はサーバ側に同名タグが存在する成功扱いのため、
      // ローカルに追加するだけで通知は行わない。
      if (
        caughtError instanceof TagError &&
        caughtError.code === TagErrorCode.DuplicateTag
      ) {
        onTagsChange([...latestTagsRef.current, name]);
        setDraft("");
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

  // Enter 押下で追加する。IME 変換中の Enter は誤発火防止のため除外する。
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }
    if (event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    void handleAdd();
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
          disabled={isLimitReached || isSubmitting}
          aria-invalid={Boolean(error) || isDuplicate}
          aria-describedby={isDuplicate ? helperId : undefined}
        />
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

      {/* 重複時のエラー表示。
          Button は disabled 状態で `disabled:pointer-events-none` が基底クラスに
          適用されるため、title 属性の tooltip は表示されない。
          そのため Input 直下の FieldNote で常時表示する。 */}
      {isDuplicate ? (
        <FieldNote tone="error">
          <span id={helperId}>「{trimmedDraft}」は既に追加されています。</span>
        </FieldNote>
      ) : null}

      {/* 追加済みタグの表示。0 件のときはプレースホルダーを表示する。 */}
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="追加済みのタグ">
          {tags.map((tag, index) => (
            <li key={rowIds[index] ?? `${id}-tag-${index}`}>
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
