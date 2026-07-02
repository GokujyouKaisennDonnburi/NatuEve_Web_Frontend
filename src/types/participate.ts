// イベント参加申し込み API（POST /api/v1/events/:id/participate）の DTO 群。
// バックエンドの契約に合わせる。OpenAPI codegen 未導入のため upload.ts 等と同様に手書きする。

// 参加申し込みエンドポイントへのリクエストボディ DTO。
export type ParticipateEventRequest = {
  // 参加者のメールアドレス（必須）。
  email: string;
  // 参加者の表示名（必須）。
  displayName: string;
};

// 参加申し込みエンドポイントのレスポンス DTO。
export type ParticipateEventResponse = {
  // 参加申し込みを受け付けたイベントID。
  eventId: string;
  // 受領日時(RFC3339)。
  acceptedAt: string;
};
