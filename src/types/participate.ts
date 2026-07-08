// イベント参加 API（POST /api/v1/events/{id}/join）の DTO 群。
// バックエンドの契約に合わせる。OpenAPI codegen 未導入のため upload.ts 等と同様に手書きする。

// 参加エンドポイントへのリクエストボディ DTO。
export type ParticipateEventRequest = {
  // 参加者のメールアドレス（必須）。
  mailAddress: string;
  // 参加者の表示名（必須）。
  username: string;
  // 参加人数（代表者を含む）。初期値は 1、最小値は 1。
  partySize: number;
};

// 参加エンドポイントのレスポンス DTO。
export type ParticipateEventResponse = {
  // 参加を受け付けたイベントID。
  eventId: string;
  // 参加者のメールアドレス。
  mailAddress: string;
  // 参加者の表示名。
  username: string;
  // 参加人数（代表者を含む）。
  partySize: number;
  // プロフィールID（ログイン参加時はユーザーID・匿名参加時は null）。
  profileId: string | null;
  // 受領日時(RFC3339)。
  createdAt: string;
};

// 参加 API のエラーレスポンスボディ DTO。
export type ParticipateEventErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

// 参加 API のエラーコード（ハンドリングで区別するもの）。
export const ParticipateErrorCode = {
  InvalidRequest: "invalid_request",
  Unauthorized: "unauthorized",
  NotFound: "not_found",
  AlreadyJoined: "already_joined",
  CapacityFull: "capacity_full",
  RequestTooLarge: "request_too_large",
  RateLimited: "rate_limited",
  InternalError: "internal_error",
} as const;

// 参加 API のエラー。code を保持し、呼び出し側で 409 Conflict 等を判別できるようにする。
export class ParticipateError extends Error {
  readonly code: string;
  readonly status: number;

  // コンストラクタ
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ParticipateError";
    this.code = code;
    this.status = status;
  }
}
