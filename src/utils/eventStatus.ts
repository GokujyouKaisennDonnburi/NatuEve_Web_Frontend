import { DAYS_BEFORE_DEADLINE } from "@/constants/config";
import { isDeadlinePassed } from "@/utils/participation";

// 開催状況の判定に使う日時。
type EventStatusSource = {
  // 開催日時(RFC3339)。
  eventDate: string;
  // 終了日時(RFC3339)。省略時は eventDate を終了日時とみなす。
  endDate?: string;
  // 申込期限(RFC3339)。未設定(null/undefined)の場合は締切なしとして扱い、
  // 「期限間近」「受付終了」のいずれにもならない。
  applicationDeadline?: string | null;
};

// 日時だけから判定できる開催状況。
// "open"(受付中) / "few_left"(期限間近) / "ended_registration"(受付終了) / "closed"(開催終了)
export type ResolvedEventStatus =
  | "open"
  | "few_left"
  | "ended_registration"
  | "closed";

// 指定した日時が今日から7日以内（未来）かを、Asia/Tokyo の日付ベースで判定する。
//
// 例: 今日が 8/22 の場合、8/29 23:59:59 JST までを「7日以内」とみなす。
// 時間単位ではなく日付単位で上限を切るため、8/22 09:00 時点で 8/29 23:00 の日時も
// 7日以内として扱われる（diffMs が 7*24h を超えても日付が7日後までなら許容）。
function isDateWithinOneWeek(dateStr: string): boolean {
  const target = new Date(dateStr);

  if (target.getTime() <= Date.now()) return false;

  // Asia/Tokyo における今日の日付（年・月・日）を取得する。
  // Intl.DateTimeFormat は実行環境のローカル時刻に依存しない。
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = formatter.format(new Date()).split("/").map(Number);

  // 7日後の 23:59:59.999 JST (= 14:59:59.999 UTC) を上限とする。
  const deadlineEnd = new Date(
    Date.UTC(y, m - 1, d + DAYS_BEFORE_DEADLINE, 14, 59, 59, 999),
  );

  return target.getTime() <= deadlineEnd.getTime();
}

// イベントの開催状況を判定する共通ルール。
//
// 終了日時を過ぎていれば「開催終了」、それ以外で申込期限を過ぎていれば「受付終了」、
// さらにそれ以外で申込期限が1週間以内なら「期限間近」、残りは「受付中」とみなす。
// 開始済みで未終了のイベント（開催中）は、申込期限を過ぎていなければ「受付中」に含める。
//
// 「期限間近」「受付終了」はどちらも申込期限(applicationDeadline)を基準にしており、
// 期限までの1週間が「期限間近」、期限を過ぎたら「受付終了」と連続して切り替わる。
// 申込期限が未設定のイベントは締切がないため、開催終了までどちらにもならない。
//
// endDate はイベント一覧 API のレスポンスにも含まれる。省略される呼び出しでは
// eventDate 基準の判定にフォールバックする
// （API 側も作成時に endDate が省略された場合は eventDate と同値を補完する）。
export function resolveEventStatus({
  eventDate,
  endDate,
  applicationDeadline,
}: Readonly<EventStatusSource>): ResolvedEventStatus {
  const closesAt = new Date(endDate || eventDate);
  if (closesAt < new Date()) {
    return "closed";
  }
  // 開催前・開催中でも、申込期限を過ぎていればもう申し込めないため「受付終了」とする。
  if (isDeadlinePassed(applicationDeadline)) {
    return "ended_registration";
  }
  if (applicationDeadline && isDateWithinOneWeek(applicationDeadline)) {
    return "few_left";
  }
  return "open";
}
