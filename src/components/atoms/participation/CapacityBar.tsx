// 「参加状況　15/20名」の淡緑バー
type CapacityBarProps = {
  // 全体の参加人数（現在の参加人数 + 選択中の人数）
  currentCount: number;
  // 全体の参加可能人数（イベントの定員）
  capacity: number;
};

// 「参加状況　15/20名」の淡緑バー
export function CapacityBar({
  currentCount,
  capacity,
}: Readonly<CapacityBarProps>) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-(--brand-green-soft) px-4 py-2">
      <span className="text-xs font-semibold text-(--brand-green-text)">
        参加状況
      </span>
      <span className="text-xs font-bold text-(--brand-green-text)">
        {currentCount}/{capacity}名
      </span>
    </div>
  );
}
