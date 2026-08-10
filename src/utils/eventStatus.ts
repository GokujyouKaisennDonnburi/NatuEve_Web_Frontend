// 開催状況の判定に使う日時。
type EventStatusSource = {
  // 開催日時(RFC3339)。
  eventDate: string;
  // 終了日時(RFC3339)。省略時は eventDate を終了日時とみなす。
  endDate?: string;
};

// 日時だけから判定できる開催状況。値は EventStatusLabel の status と同じ語彙。
// EventStatusLabel は「期限間近」「受付終了」も持つが、参加人数や受付締切を
// 知る手段が無いためここでは判定しない。
// 語彙がずれた場合は EventStatusLabel へ渡す呼び出し側で型エラーになる。
type ResolvedEventStatus = "open" | "closed";

// イベントの開催状況を判定する共通ルール。
//
// 終了日時を過ぎていれば「開催終了」、それ以外は「受付中」とみなす。
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
  return closesAt < new Date() ? "closed" : "open";
}
