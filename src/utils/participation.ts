import type { EventDetailCost } from "@/types/event";
import { formatNumber } from "@/utils/format";

// カテゴリごとの選択人数。costs 配列と同じ並び・同じ長さで持つ。
// カテゴリ名は重複し得るため、名前ではなく添字で対応付ける。
export type ParticipantCounts = number[];

// 料金内訳の1行分。
export type ParticipationCostLine = {
  category: string;
  cost: number;
  count: number;
  subtotal: number;
};

// 料金内訳と合計。
export type ParticipationSummary = {
  lines: ParticipationCostLine[];
  totalCount: number;
  totalAmount: number;
};

// 参加費用が未設定のイベント向けのフォールバック行。
// 投稿画面では1件以上を必須にしているが、取得したデータが空でも
// 人数だけは選べるようにするため、無料の単一カテゴリとして扱う。
const FALLBACK_COST: EventDetailCost = { category: "参加人数", cost: 0 };

// 表示に使う参加費用の一覧を返す。空の場合はフォールバックを1件返す。
export function resolveParticipationCosts(
  costs: EventDetailCost[] | undefined,
): EventDetailCost[] {
  return costs && costs.length > 0 ? costs : [FALLBACK_COST];
}

// 選択人数の初期値。先頭カテゴリを1名、それ以外を0名にする。
// 申し込み画面を開いた直後でも「1名で申し込む」がそのまま押せる状態にするため。
export function createInitialCounts(
  costs: EventDetailCost[],
): ParticipantCounts {
  return costs.map((_, index) => (index === 0 ? 1 : 0));
}

// 金額を表示用に整形する。0円は「無料」と表示する。
export function formatCostLabel(cost: number): string {
  return cost === 0 ? "無料" : `${formatNumber(cost)}円`;
}

// 選択人数から料金内訳と合計を組み立てる。
// counts が costs より短い場合は 0 名として扱う。
export function buildParticipationSummary(
  costs: EventDetailCost[],
  counts: ParticipantCounts,
): ParticipationSummary {
  const lines = costs.map((cost, index) => {
    const count = counts[index] ?? 0;

    return {
      category: cost.category,
      cost: cost.cost,
      count,
      subtotal: cost.cost * count,
    };
  });

  return {
    lines,
    totalCount: lines.reduce((total, line) => total + line.count, 0),
    totalAmount: lines.reduce((total, line) => total + line.subtotal, 0),
  };
}
