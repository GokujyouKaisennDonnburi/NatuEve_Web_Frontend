import { RequiredBadge } from "@/components/atoms/RequiredBadge";

// イベントアイテムのバッジコンポーネント
type EventItemBadgeProps = {
  item: string;
  isRequired: boolean;
};

// イベントアイテムのバッジコンポーネント
export function EventItemBadge({
  item,
  isRequired,
}: Readonly<EventItemBadgeProps>) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      {/* 必須 or 任意 のバッジ */}
      <RequiredBadge isRequired={isRequired} />
      {/* 持ち物の名前 */}
      <span className="min-w-0 break-words text-sm text-slate-700">{item}</span>
    </div>
  );
}
