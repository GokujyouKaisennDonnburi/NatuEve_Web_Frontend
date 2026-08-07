import { FilterTag } from "@/components/atoms/FilterTag";
import { cn } from "@/lib/utils";
import type { TagItem } from "@/types/tag";

// イベントタグリストのプロパティ型定義
type EventTagListProps = {
  tags?: TagItem[];
  className?: string;
};

// イベントタグリストコンポーネント
// 見た目はイベント一覧のカードと同じ FilterTag（白地・緑枠）に揃える。
// タグ未提供時(undefined)や 0 件のときは何も描画しないことで、
// 本番で tags が欠落したイベントの表示崩れを防ぐ
export function EventTagList({ tags, className }: Readonly<EventTagListProps>) {
  const safeTags = tags ?? [];
  if (safeTags.length === 0) return null;

  return (
    <ul
      className={cn("flex flex-wrap items-center gap-2", className)}
      aria-label="イベントタグ"
    >
      {safeTags.map((tag) => (
        <li key={tag.id}>
          <FilterTag
            label={tag.name}
            title={tag.name}
            className="max-w-[12rem] truncate"
          />
        </li>
      ))}
    </ul>
  );
}
