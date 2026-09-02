// イベント参加 API（POST /api/v1/events/{id}/join）の DTO 群。
// バックエンドの契約に合わせる。OpenAPI codegen 未導入のため upload.ts 等と同様に手書きする。

// 参加内訳1件分の DTO。カテゴリにはイベント詳細の costs[].category を指定する。
// 大文字小文字は区別されない。0人のカテゴリは送信しない。
export type ParticipantEntry = {
  // 費用カテゴリ名（イベント詳細の costs[].category に存在する名前）。
  category: string;
  // そのカテゴリの参加人数（1以上の整数）。
  headCount: number;
};

// 参加エンドポイントへのリクエストボディ DTO。
export type ParticipateEventRequest = {
  // 参加者のメールアドレス（必須）。
  mailAddress: string;
  // 参加者の表示名（必須）。
  username: string;
  // カテゴリ別の参加人数内訳（1件以上）。0人のカテゴリは含めない。
  // 合計人数（partySize）はサーバーが内訳から算出するため送信しない。
  participants: ParticipantEntry[];
};

// 参加エンドポイントのレスポンス DTO。
export type ParticipateEventResponse = {
  // 参加を受け付けたイベントID。
  eventId: string;
  // 参加者のメールアドレス。
  mailAddress: string;
  // 参加者の表示名。
  username: string;
  // カテゴリ別の参加人数内訳（リクエスト内容をそのまま反映）。
  participants: ParticipantEntry[];
  // 合計参加人数（代表者を含む）。サーバーが participants の内訳から算出する。
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

// 参加者のプロフィールサマリーDTO（swagger の ProfileSummary）。
export type EventMemberProfile = {
  // プロフィールID（ユーザーID）。
  id: string;
  // アカウントの表示名（未設定なら空文字）。
  displayName: string;
  // アバター画像URL（未設定なら空文字）。
  avatarUrl: string;
};

// 参加者1件分のDTO。匿名参加時は profile が null となる。
// swagger（GET /api/v1/events/{id}/members）のレスポンス定義に合わせ、
// username / mailAddress / partySize / profile / createdAt の5項目のみ。
export type EventMember = {
  // 申込時にフォームへ入力された名前。匿名参加でも必ず値が入る。
  // アカウントの表示名（profile.displayName）とは別物で、一致するとは限らない。
  username: string;
  // 参加者のメールアドレス。
  mailAddress: string;
  // 参加人数（代表者を含む）。
  partySize: number;
  // 参加者のプロフィールサマリー（ログイン参加時のみ・匿名参加時は null）。
  profile: EventMemberProfile | null;
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
// 認証ユーザー自身の、指定イベントに対する最新の参加状態を取得する。要認証。
// 履歴がない場合は action=null, participating=false, updatedAt=null となる（200）。

// 参加状態のアクション種別。
// "join"（参加）/ "leave"（参加キャンセル）/ "absence"（申込期限後の欠席連絡）/
// null（履歴なし）。leave と absence はどちらも「参加していない」状態を表す。
export type ParticipationAction = "join" | "leave" | "absence" | null;

// 参加状態レスポンスDTO。
export type ParticipationLogsResponse = {
  // 直近のアクション。履歴がない場合は null。
  action: ParticipationAction;
  // 現在のユーザーがこのイベントに参加中かどうか。
  participating: boolean;
  // 直近の参加申込人数（代表者を含む）。参加履歴がない、または直近が leave の場合は undefined。
  partySize?: number;
  // 直近のアクション日時(RFC3339)。履歴がない場合は null。
  updatedAt: string | null;
};

// 参加状態取得APIのエラーレスポンスボディDTO。
export type GetParticipationLogsErrorBody = ParticipateEventErrorBody;

// 参加状態取得APIのエラーコード（ハンドリングで区別するもの）。
export const ParticipationLogsErrorCode = {
  InvalidRequest: "invalid_request",
  Unauthorized: "unauthorized",
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

// イベント参加キャンセル API（POST /api/v1/events/{id}/leave）の DTO 群。
// ログイン参加者が参加を取り消す。要認証。匿名参加（profileId=null）は対象外。
// 参加行を削除し、参加状態ログへ action=leave を1件追記する。

// 参加キャンセルエンドポイントのレスポンス DTO。
export type LeaveResponse = {
  // 実行されたアクション。本エンドポイントでは常に "leave"。
  action: "leave";
  // キャンセルしたユーザーのプロフィールID（ログイン参加時）。
  profileId: string;
  // キャンセルを受け付けたイベントID。
  eventId: string;
  // キャンセル受領日時(RFC3339)。
  createdAt: string;
};

// 参加キャンセルAPIのエラーレスポンスボディDTO。
export type LeaveErrorBody = ParticipateEventErrorBody;

// 参加キャンセルAPIのエラーコード（ハンドリングで区別するもの）。
// 404 not_found はイベント不存在 または 未参加の両方をカバーする。
export const LeaveErrorCode = {
  InvalidRequest: "invalid_request",
  Unauthorized: "unauthorized",
  NotFound: "not_found",
  // 申込期限を過ぎたイベントの取り消し（409）。
  // 期限後は取り消せないため、代わりに欠席連絡 API を使う。
  DeadlinePassed: "deadline_passed",
  InternalError: "internal_error",
} as const;

// 参加キャンセルAPIのエラー。code を保持し、呼び出し側で 404 NotFound 等を判別できるようにする。
export class LeaveError extends Error {
  readonly code: string;
  readonly status: number;

  // コンストラクタ
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "LeaveError";
    this.code = code;
    this.status = status;
  }
}

// 自分の申込内容取得 API（GET /api/v1/events/{id}/members/me）の DTO 群。
// 認証ユーザー自身の、指定イベントへの申込内容を返す。要認証。
// 呼び出し元が本人なので profileId は含まれない。
//
// 金額は返らない（ADR-0023）。参加費を表示する場合はイベント詳細
// （GET /api/v1/events/{id}）の costs[] と category で突合して補う。
// 双方が同じ費用行を参照しているためカテゴリ改名では壊れないが、
// 突合で得られるのは「申込時の金額」ではなく現在値である点に注意する。

// 自分の申込内容レスポンス DTO。
export type MyEventApplicationResponse = {
  // 申し込んだイベントID。
  eventId: string;
  // 申込時に入力された名前。アカウントの表示名とは別物で、一致するとは限らない。
  username: string;
  // 申込時のメールアドレス。
  mailAddress: string;
  // 合計人数（代表者を含む）。participants[].headCount の合計と必ず一致する。
  partySize: number;
  // カテゴリ別の申し込み内訳。カテゴリ名の昇順で、常に1件以上返る。
  participants: ParticipantEntry[];
  // 申込日時(RFC3339)。
  createdAt: string;
};

// 自分の申込内容取得APIのエラーレスポンスボディDTO。
export type GetMyEventApplicationErrorBody = ParticipateEventErrorBody;

// 自分の申込内容取得APIのエラーコード（ハンドリングで区別するもの）。
// 404 not_found はイベント不存在と「未申込・キャンセル済み・匿名申込」の
// 両方を指す（leave の流儀に合わせ code は共通で、message でしか区別できない）。
// イベント詳細画面からしか開かない導線のためイベント不存在は実質起きず、
// 呼び出し側では区別せず「申込情報なし」として扱う。
export const MyEventApplicationErrorCode = {
  InvalidRequest: "invalid_request",
  Unauthorized: "unauthorized",
  NotFound: "not_found",
  InternalError: "internal_error",
} as const;

// 自分の申込内容取得APIのエラー。code を保持し、呼び出し側で 401 / 404 等を判別できるようにする。
export class MyEventApplicationError extends Error {
  readonly code: string;
  readonly status: number;

  // コンストラクタ
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "MyEventApplicationError";
    this.code = code;
    this.status = status;
  }
}

// 欠席連絡 API（POST /api/v1/events/{id}/absence）の DTO 群。
// 申込期限を過ぎた参加者が、主催者へ欠席を連絡する。要認証。
// 参加行を削除し、参加状態ログへ action=absence を1件追記したうえで、
// 主催者宛に欠席連絡メールが非同期で送られる（レスポンスには含まれない）。
// 期限を過ぎたイベントの取り消しは leave ではなくこちらを使う（leave は 409 になる）。
// 逆に期限内・開催終了後・取りやめ済みのイベントは 409 となる。
// 申込期限が未設定のイベントは「期限前」に当たらないため、開催終了までいつでも呼べる。

// 欠席理由の選択肢。表示ラベルは UI 側で対応付ける。
export const ABSENCE_REASONS = [
  "illness",
  "family",
  "weather_transport",
  "other",
] as const;

// 欠席理由。
export type AbsenceReason = (typeof ABSENCE_REASONS)[number];

// 欠席連絡エンドポイントへのリクエストボディ DTO。
// reason / detail はどちらも任意で、理由を選ばずに欠席だけを伝えることもできる。
// ボディ自体は必須のため、どちらも指定しない場合は {} を送る。
export type AbsenceRequest = {
  // 欠席理由（任意）。未選択なら送信しない（省略・null・空文字はいずれも未指定扱い）。
  reason?: AbsenceReason;
  // 欠席理由の補足（任意・trim 後200文字以内）。未入力なら送信しない。
  detail?: string;
};

// 欠席連絡エンドポイントのレスポンス DTO。
export type AbsenceResponse = {
  // 欠席連絡を受け付けたイベントID。
  eventId: string;
  // 連絡したユーザーのプロフィールID。
  profileId: string;
  // 実行されたアクション。本エンドポイントでは常に "absence"。
  action: "absence";
  // 受け付けた欠席理由。未指定の場合は null。
  reason: AbsenceReason | null;
  // 受け付けた補足（trim 済み）。未指定の場合は null。
  detail: string | null;
  // 受領日時(RFC3339)。
  createdAt: string;
};

// 欠席連絡APIのエラーレスポンスボディDTO。
export type AbsenceErrorBody = ParticipateEventErrorBody;

// 欠席連絡APIのエラーコード（ハンドリングで区別するもの）。
// 404 not_found はイベント不存在 または 未参加の両方をカバーする。
export const AbsenceErrorCode = {
  InvalidRequest: "invalid_request",
  Unauthorized: "unauthorized",
  NotFound: "not_found",
  // 申込期限前（409）。期限内は取り消し（leave）で対応する。
  BeforeDeadline: "before_deadline",
  // 開催終了後（409）。
  EventEnded: "event_ended",
  // イベントが取りやめ済み（409）。
  EventCancelled: "event_cancelled",
  InternalError: "internal_error",
} as const;

// 欠席連絡APIのエラー。code を保持し、呼び出し側で 404 NotFound 等を判別できるようにする。
export class AbsenceError extends Error {
  readonly code: string;
  readonly status: number;

  // コンストラクタ
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "AbsenceError";
    this.code = code;
    this.status = status;
  }
}
