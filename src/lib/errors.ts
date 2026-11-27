// イベント詳細取得 API のエラー。
// status を保持し、呼び出し側で 404（イベント不存在）を判別できるようにする。
export class EventDetailError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "EventDetailError";
    this.status = status;
  }
}

// 取りやめ済み（画面上は「削除」）のイベントを表すステータス。
// 詳細 API は取りやめ済みのイベントに 410 Gone を返す（NatuEve_API#314）。
export const EVENT_GONE_STATUS = 410;

// イベント詳細取得が「取りやめ済みのイベント」で失敗したかどうか。
// API の変更前（200 + cancelledAt）も getEventDetail で 410 にそろえて送出する（ADR-0008）。
export function isEventGoneError(error: unknown): error is EventDetailError {
  return (
    error instanceof EventDetailError && error.status === EVENT_GONE_STATUS
  );
}
