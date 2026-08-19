import {
  formatCostLabel,
  type ParticipationSummary,
} from "@/utils/participation";
import { Fragment } from "react";

// 料金内訳と合計
type ParticipationCostSummaryProps = {
  summary: ParticipationSummary;
  // ブロックの見出し（例: 「参加人数と参加費」）。省略可
  title?: string;
  // 合計の下に添える補足文（例: 「イベント指定の方法でお支払いください。」）。省略可
  note?: string;
};

// 料金内訳と合計
export function ParticipationCostSummary({
  summary,
  title,
  note,
}: Readonly<ParticipationCostSummaryProps>) {
  return (
    <div className="space-y-3 rounded-xl border border-(--brand-green-line) bg-(--brand-green-soft) px-5 py-4">
      {title ? (
        <p className="text-sm font-bold text-slate-900">{title}</p>
      ) : null}

      {/* カテゴリ・人数・単価・小計を列ごとに揃える。
          人数と小計は右揃えにして、桁が変わっても縦の位置がずれないようにする。 */}
      <div className="grid grid-cols-[auto_auto_auto_auto_1fr] items-center gap-x-2 gap-y-1.5 text-sm text-slate-600">
        {summary.lines.map((line, index) => (
          // カテゴリ名・金額はどちらも重複し得るため、値では一意にできない。
          // summary.lines は costs の並び順そのままで増減しないため添字を key にする。
          // biome-ignore lint/suspicious/noArrayIndexKey: 並び順が変化しない固定リストのため添字で一意にする。
          <Fragment key={index}>
            <span>{line.category}</span>
            <span className="text-right tabular-nums">{line.count}名</span>
            <span>×</span>
            <span className="tabular-nums">{formatCostLabel(line.cost)}</span>
            <span className="text-right tabular-nums">
              {formatCostLabel(line.subtotal)}
            </span>
          </Fragment>
        ))}
      </div>

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
