import { DAYS_BEFORE_DEADLINE } from "@/constants/config";

// 開催状況の判定に使う日時。
type EventStatusSource = {
  // 開催日時(RFC3339)。
  eventDate: string;
  // 終了日時(RFC3339)。省略時は eventDate を終了日時とみなす。
  endDate?: string;
};

// 日時だけから判定できる開催状況。値は EventStatusLabel の status と同じ語彙。
// 申込期限のAPIが未実装のため、開催日時(eventDate)の1週間前を「期限間近」とみなす。
type ResolvedEventStatus = "open" | "few_left" | "closed";

// 開催日時が現在から1週間以内（未来）かを判定する。
function isDateWithinOneWeek(dateStr: string): boolean {
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const oneWeekMs = DAYS_BEFORE_DEADLINE * 24 * 60 * 60 * 1000;
  return diffMs > 0 && diffMs <= oneWeekMs;
}

// イベントの開催状況を判定する共通ルール。
//
// 終了日時を過ぎていれば「開催終了」、それ以外で開催日時が1週間以内なら「期限間近」、
// それ以外は「受付中」とみなす。
// 開始済みで未終了のイベント（開催中）は「受付中」に含める。
//
// endDate はイベント詳細 API のレスポンスにのみ存在し、イベント一覧 API には含まれない。
// そのため endDate を渡さない呼び出しでは eventDate 基準の判定にフォールバックする
// （API 側も作成時に endDate が省略された場合は eventDate と同値を補完する）。
export function resolveEventStatus({
  eventDate,
  endDate,
}: Readonly<EventStatusSource>): ResolvedEventStatus {
  const closesAt = new Date(endDate || eventDate);
  if (closesAt < new Date()) {
    return "closed";
  }
  if (isDateWithinOneWeek(eventDate)) {
    return "few_left";
  }
  return "open";
}
