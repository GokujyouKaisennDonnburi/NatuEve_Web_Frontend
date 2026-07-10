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

// イベント参加者一覧取得 API（GET /api/v1/events/{id}/members）の DTO 群。
// 主催者のみが閲覧できる。バックエンドの契約に合わせる。

// 参加者1件分のDTO。匿名参加時は profileId が null となる。
// swagger（GET /api/v1/events/{id}/members）のレスポンス定義に合わせ、
// username / mailAddress / partySize / profileId / createdAt の5項目のみ。
export type EventMember = {
  // 参加者の表示名。
  username: string;
  // 参加者のメールアドレス。
  mailAddress: string;
  // 参加人数（代表者を含む）。
  partySize: number;
  // プロフィールID（ログイン参加時はユーザーID・匿名参加時は null）。
  profileId: string | null;
  // 申込日時(RFC3339)。
  createdAt: string;
};

// 参加者一覧レスポンスDTO。
export type EventMembersResponse = {
  // 参加者一覧。
  members: EventMember[];
  // 参加組数（members 配列長と一致）。
  totalCount: number;
  // 合計参加人数（members の partySize 総和）。
  totalMembers: number;
};

// 参加者一覧取得APIのエラーレスポンスボディDTO。
export type GetEventMembersErrorBody = ParticipateEventErrorBody;

// イベント参加状態取得 API（GET /api/v1/events/{id}/participation-logs）の DTO 群。
// ログインユーザーが当該イベントに参加中かどうかを判定する。要認証。

// 参加状態レスポンスDTO。
export type ParticipationLogsResponse = {
  // 現在のユーザーがこのイベントに参加中かどうか。
  participating: boolean;
};

// 参加状態取得APIのエラーレスポンスボディDTO。
export type GetParticipationLogsErrorBody = ParticipateEventErrorBody;

// 参加状態取得APIのエラーコード（ハンドリングで区別するもの）。
export const ParticipationLogsErrorCode = {
  InvalidRequest: "invalid_request",
  Unauthorized: "unauthorized",
  Forbidden: "forbidden",
  NotFound: "not_found",
  InternalError: "internal_error",
} as const;

// 参加状態取得APIのエラー。code を保持し、呼び出し側で 401 / 403 等を判別できるようにする。
export class ParticipationLogsError extends Error {
  readonly code: string;
  readonly status: number;

  // コンストラクタ
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ParticipationLogsError";
    this.code = code;
    this.status = status;
  }
}

// イベント参加キャンセル API（POST /api/v1/events/{id}/joined-cancel）の DTO 群。
// 参加済みユーザーが参加をキャンセルする。要認証。リクエストボディは不要。

// 参加キャンセルエンドポイントのレスポンス DTO。
export type JoinedCancelResponse = {
  // キャンセルしたユーザーのプロフィールID（匿名参加時は null）。
  profileId: string | null;
  // キャンセルを受け付けたイベントID。
  eventId: string;
  // キャンセル受領日時(RFC3339)。
  createdAt: string;
};

// 参加キャンセルAPIのエラーレスポンスボディDTO。
export type JoinedCancelErrorBody = ParticipateEventErrorBody;

// 参加キャンセルAPIのエラーコード（ハンドリングで区別するもの）。
export const JoinedCancelErrorCode = {
  InvalidRequest: "invalid_request",
  Unauthorized: "unauthorized",
  Forbidden: "forbidden",
  NotFound: "not_found",
  NotJoined: "not_joined",
  InternalError: "internal_error",
} as const;

// 参加キャンセルAPIのエラー。code を保持し、呼び出し側で 409 Not-Found 等を判別できるようにする。
export class JoinedCancelError extends Error {
  readonly code: string;
  readonly status: number;

  // コンストラクタ
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "JoinedCancelError";
    this.code = code;
    this.status = status;
  }
}
