import type { EventDetailCost } from "@/types/event";
import type { ParticipantEntry } from "@/types/participate";
import { formatNumber } from "@/utils/format";

// カテゴリごとの選択人数。costs 配列と同じ並び・同じ長さで持つ。
// カテゴリ名は重複し得るため、名前ではなく添字で対応付ける。
export type ParticipantCounts = number[];

// 料金内訳の1行分。
// 申し込みフローでは金額が必ず決まるが、申込済みの内容を表示する場面では
// イベントの費用カテゴリと突合できないことがあり、その場合は金額を null（不明）とする。
export type ParticipationCostLine = {
  category: string;
  // 1名あたりの参加費（円）。突合できなかった場合は null。
  cost: number | null;
  count: number;
  // 小計。cost が null の場合は null。
  subtotal: number | null;
};

// 料金内訳と合計。
export type ParticipationSummary = {
  lines: ParticipationCostLine[];
  totalCount: number;
  // 合計金額。金額不明の行が1件でもある場合は null。
  totalAmount: number | null;
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

// 金額を表示用に整形する。0円は「無料」、金額不明は「—」と表示する。
export function formatCostLabel(cost: number | null): string {
  if (cost === null) return "—";

  return cost === 0 ? "無料" : `${formatNumber(cost)}円`;
}

// 合計金額を表示用に整形する。
// 金額不明の行があると合計は算出できないため、過少な金額を見せずに「金額不明」と明示する。
export function formatTotalAmountLabel(totalAmount: number | null): string {
  if (totalAmount === null) return "金額不明";

  return formatCostLabel(totalAmount);
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

// 申込内容（カテゴリと人数）とイベントの費用カテゴリを突合して、料金内訳と合計を組み立てる。
//
// 申込内容 API（GET /api/v1/events/{id}/members/me）は金額を返さないため、
// 1名あたりの参加費はイベント詳細の costs[] から引く。どちらも同じ費用行を参照しており、
// 主催者がカテゴリを改名しても同時に変わるため突合は壊れない。
// ただし引ける金額は現在値であり「申込時の金額」ではない。費用行そのものが削除された
// 場合は引けず、その行の金額は null（不明）として人数だけを残す。
//
// 行の並びはイベントの費用カテゴリ順に揃え、イベント詳細の費用欄と見比べられるようにする
// （API は申込内訳をカテゴリ名の昇順で返すため、そのままでは並びが食い違う）。
export function buildApplicationSummary(
  eventCosts: EventDetailCost[] | undefined,
  participants: ParticipantEntry[],
): ParticipationSummary {
  // 費用が未設定のイベントは申し込み側もフォールバック（無料の「参加人数」）で申し込むため、
  // 突合の基準も同じフォールバックに揃える。
  const resolvedCosts = resolveParticipationCosts(eventCosts);

  // カテゴリ名の表記ゆれで突合を落とさないよう、前後の空白と大文字小文字を無視して引き当てる。
  // 参加申し込み API のカテゴリ検証と同じ扱いに合わせている。
  const normalize = (category: string): string => category.trim().toLowerCase();

  // 同名カテゴリが複数件返っても人数を取りこぼさないよう合算する。
  const headCounts = new Map<string, number>();
  for (const participant of participants) {
    const key = normalize(participant.category);
    headCounts.set(key, (headCounts.get(key) ?? 0) + participant.headCount);
  }

  const lines: ParticipationCostLine[] = [];

  // イベントの費用カテゴリ順に、申し込みのあった行だけを並べる。
  for (const eventCost of resolvedCosts) {
    const key = normalize(eventCost.category);
    const count = headCounts.get(key);

    if (!count) continue;

    lines.push({
      category: eventCost.category,
      cost: eventCost.cost,
      count,
      subtotal: eventCost.cost * count,
    });

    // 同名の費用行が複数ある場合に人数を二重計上しないよう、引き当て済みを取り除く。
    headCounts.delete(key);
  }

  // 費用カテゴリから引けなかった申込は、金額不明の行として末尾に残す。
  // 金額は出せなくても「何名で申し込んだか」は失わせない。
  for (const participant of participants) {
    const key = normalize(participant.category);
    const count = headCounts.get(key);

    if (!count) continue;

    lines.push({
      category: participant.category,
      cost: null,
      count,
      subtotal: null,
    });

    headCounts.delete(key);
  }

  const hasUnknownAmount = lines.some((line) => line.subtotal === null);

  return {
    lines,
    totalCount: lines.reduce((total, line) => total + line.count, 0),
    totalAmount: hasUnknownAmount
      ? null
      : lines.reduce((total, line) => total + (line.subtotal ?? 0), 0),
  };
}
