// 「申し込みできる人数　2/4名」の淡緑バー
type CapacityBarProps = {
  // 現在選択中の合計人数
  selectedCount: number;
  // 申し込める上限人数（残り枠）
  capacity: number;
};

// 「申し込みできる人数　2/4名」の淡緑バー
export function CapacityBar({
  selectedCount,
  capacity,
}: Readonly<CapacityBarProps>) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-(--brand-green-soft) px-4 py-2">
      <span className="text-xs font-semibold text-(--brand-green-text)">
        申し込みできる人数
      </span>
      <span className="text-xs font-bold text-(--brand-green-text)">
        {selectedCount}/{capacity}名
      </span>
    </div>
  );
}
