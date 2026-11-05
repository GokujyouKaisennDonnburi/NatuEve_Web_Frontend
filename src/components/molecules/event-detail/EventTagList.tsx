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
      aria-label="イベントタグ"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: キーボードでタグのスクロール領域を操作できるようにするため
      tabIndex={0}
      className={cn(
        // 縦長画面では折返さず1行にして横スクロールさせる(sm以上は従来どおり折返し)
        "flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-auto sm:flex-wrap sm:overflow-visible sm:pb-0",
        // はみ出しに気付けるよう右端をフェードする。フォーカス中はリングが欠けないようフェードを解除する
        "[mask-image:linear-gradient(to_right,black_calc(100%_-_2rem),transparent)] [-webkit-mask-image:linear-gradient(to_right,black_calc(100%_-_2rem),transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:[mask-image:none] focus-visible:[-webkit-mask-image:none]",
        "sm:[mask-image:none] sm:[-webkit-mask-image:none]",
        className,
      )}
    >
      {safeTags.map((tag) => (
        <li key={tag.id} className="shrink-0">
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
