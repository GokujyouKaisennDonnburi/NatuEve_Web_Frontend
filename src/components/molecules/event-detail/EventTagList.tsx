import { Badge } from "@/components/atoms/Badge";
import type { TagItem } from "@/types/tag";

// イベントタグリストのプロパティ型定義
type EventTagListProps = {
  tags?: TagItem[];
};

// イベントタグリストコンポーネント
// タグ未提供時(undefined)や 0 件のときは何も描画しないことで、
// 本番で tags が欠落したイベントの表示崩れを防ぐ
export function EventTagList({ tags }: Readonly<EventTagListProps>) {
  const safeTags = tags ?? [];
  if (safeTags.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label="イベントタグ">
      {safeTags.map((tag) => (
        <li key={tag.id}>
          <Badge
            tone="subtle"
            className="max-w-[12rem] truncate"
            title={tag.name}
          >
            {tag.name}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
