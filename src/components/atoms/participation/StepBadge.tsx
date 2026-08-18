import { Check } from "lucide-react";

// 申し込みモーダルのステップ表示1件分（丸バッジ＋ラベル）
type StepBadgeProps = {
  // 到達済み（緑）か未到達（グレー）か
  isActive: boolean;
  // バッジ内の表示。数値はステップ番号、"check" はチェックアイコン
  indicator: number | "check";
  // 現在地のステップかどうか。色以外でも支援技術へ伝えるために使う
  isCurrent?: boolean;
  label: string;
};

// 申し込みモーダルのステップ表示1件分（丸バッジ＋ラベル）
export function StepBadge({
  isActive,
  indicator,
  isCurrent,
  label,
}: Readonly<StepBadgeProps>) {
  return (
    <span
      aria-current={isCurrent ? "step" : undefined}
      className="inline-flex items-center gap-1.5"
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${
          isActive ? "bg-(--brand-green)" : "bg-slate-300"
        }`}
      >
        {indicator === "check" ? (
          <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
        ) : (
          indicator
        )}
      </span>
      <span
        className={`text-xs font-medium ${
          isActive ? "text-(--brand-green-text)" : "text-slate-400"
        }`}
      >
        {label}
      </span>
    </span>
  );
}
