import {
  formatCostLabel,
  type ParticipationSummary,
} from "@/utils/participation";

// 料金内訳と合計
type ParticipationCostSummaryProps = {
  summary: ParticipationSummary;
  // 合計の下に添える補足文（例: 「イベント指定の方法でお支払いください。」）。省略可
  note?: string;
};

// 料金内訳と合計
export function ParticipationCostSummary({
  summary,
  note,
}: Readonly<ParticipationCostSummaryProps>) {
  return (
    <div className="space-y-3 rounded-xl border border-(--brand-green-line) bg-(--brand-green-soft) px-5 py-4">
      {summary.lines.map((line, index) => (
        <div
          // カテゴリ名・金額はどちらも重複し得るため、値では一意にできない。
          // summary.lines は costs の並び順そのままで増減しないため添字を key にする。
          // biome-ignore lint/suspicious/noArrayIndexKey: 並び順が変化しない固定リストのため添字で一意にする。
          key={index}
          className="flex items-center justify-between text-sm text-slate-600"
        >
          <span>
            {line.category} {line.count}名 × {formatCostLabel(line.cost)}
          </span>
          <span>{formatCostLabel(line.subtotal)}</span>
        </div>
      ))}
      <div className="border-t border-slate-200" />
      <div className="flex items-baseline justify-between">
        <span className="text-base font-bold text-slate-900">
          合計 {summary.totalCount}名
        </span>
        <span className="text-xl font-bold text-slate-900">
          {formatCostLabel(summary.totalAmount)}
        </span>
      </div>
      {note ? <p className="text-xs text-slate-400">{note}</p> : null}
    </div>
  );
}
