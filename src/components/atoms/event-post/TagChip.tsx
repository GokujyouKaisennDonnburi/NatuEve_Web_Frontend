import { X } from "lucide-react";

import { Badge } from "@/components/atoms/Badge";

// タグ入力欄で表示される1件のタグチップ。
// 表示は EventTagList と同じ `Badge tone="subtle"` を使い、右側に削除ボタンを併置する。
type TagChipProps = {
  label: string;
  onRemove: () => void;
};

export function TagChip({ label, onRemove }: Readonly<TagChipProps>) {
  return (
    <Badge
      tone="subtle"
      className="max-w-[12rem] gap-1"
      title={label}
      aria-label={`タグ「${label}」`}
    >
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`タグ「${label}」を削除`}
        className="-mr-1 inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-teal-700 transition hover:bg-teal-200 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
