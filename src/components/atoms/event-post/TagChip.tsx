import { X } from "lucide-react";

import { Badge } from "@/components/atoms/Badge";

// タグ入力欄で表示される1件のタグチップ。
// 表示は Badge を土台にしつつ、投稿フォームのブランド配色に合わせ、
// 右側に削除ボタンを併置する。
type TagChipProps = {
  label: string;
  onRemove: () => void;
};

export function TagChip({ label, onRemove }: Readonly<TagChipProps>) {
  return (
    <Badge
      tone="subtle"
      className="max-w-[12rem] gap-1 bg-(--brand-green-soft) font-medium text-(--brand-green-text)"
      title={label}
      aria-label={`タグ「${label}」`}
    >
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`タグ「${label}」を削除`}
        className="-mr-1 inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-(--brand-green-text) transition hover:bg-(--brand-green-line) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--brand-green)/40"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
