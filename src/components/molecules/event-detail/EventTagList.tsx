import { Badge } from "@/components/atoms/Badge";

// イベントタグリストのプロパティ型定義
type EventTagListProps = {
  tags: string[];
};

// イベントタグリストコンポーネント
// タグ未設定時は何も描画しないことで、本番で tags が空のイベントの表示崩れを防ぐ
export function EventTagList({ tags }: Readonly<EventTagListProps>) {
  if (tags.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label="イベントタグ">
      {tags.map((tag) => (
        <li key={tag}>
          <Badge tone="subtle" className="max-w-[12rem] truncate">
            {tag}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export default EventTagList;
