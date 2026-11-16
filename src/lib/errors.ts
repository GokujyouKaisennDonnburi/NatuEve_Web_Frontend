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
