import type { TagItem } from "@/types/tag";

// イベント作成 API（POST /api/v1/events）の DTO 群。
// バックエンド（NatuEve_API internal/model/event.go の CreateEventRequest）と
// フィールド名・型を一致させる。OpenAPI codegen は未導入のため upload.ts と同様に手書きする。

// 費用内訳の入力 DTO（カテゴリと金額）。cost は円・0 以上の整数。
export type EventCostInput = {
  category: string;
  cost: number;
};

// 持ち物の入力 DTO。
export type EventItemInput = {
  item: string;
  isRequired: boolean;
};

// イベント作成エンドポイントへのリクエストボディ DTO。
export type CreateEventRequest = {
  // イベントタイトル（必須・255文字以内）。
  title: string;
  // イベント説明（必須）。
  description: string;
  // 開催場所（必須・255文字以内）。
  location: string;
  // 開催日時(RFC3339)（必須）。
  eventDate: string;
  // 終了日時(RFC3339)（API 上は任意・省略時は eventDate と同値が補完される）。
  // フォーム側では UX 補助として必須入力にしている。
  endDate?: string;
  // 定員（任意・0=未設定・正数=定員）。
  capacity?: number;
  // 関連URL（任意・255文字以内・http/https）。
  externalUrl?: string;
  // 費用内訳（1件以上必須）。
  costs: EventCostInput[];
  // 持ち物リスト（任意）。
  items?: EventItemInput[];
  // タグIDリスト（任意・各要素はタグのUUID・最大10件）。
  tagIds?: string[];
  // 画像オブジェクトキーの一覧（任意）。
  imageObjectKeys?: string[];
  // PDF オブジェクトキーの一覧（任意・各要素255文字以内）。
  pdfObjectKeys?: string[];
  // 画像の元ファイル名一覧（任意）。指定時は imageObjectKeys と同数・同順。
  imageFilenames?: string[];
  // PDF の元ファイル名一覧（任意）。指定時は pdfObjectKeys と同数・同順。
  pdfFilenames?: string[];
};

// イベント作成エンドポイントのレスポンス DTO。
export type CreateEventResponse = {
  // 生成されたイベントの UUID。
  id: string;
  // レコード作成日時(RFC3339)。
  createdAt: string;
};

// イベント詳細取得 API のプロフィール情報 DTO。
export type EventDetailProfile = {
  id: string;
  displayName: string;
  avatarUrl: string;
};

// イベント詳細取得 API の費用内訳 DTO。
export type EventDetailCost = {
  category: string;
  cost: number;
};

// イベント詳細取得 API の持ち物 DTO。
export type EventDetailItem = {
  item: string;
  isRequired: boolean;
};

export type EventDetailReport = {
  id: string;
  createdAt: string;
  authorName?: string;
  authorAvatarUrl?: string;
  content?: string;
  externalUrl?: string;
  imageObjectKeys?: string[];
  imageUrls?: string[];
  pdfObjectKeys?: string[];
  pdfUrls?: string[];
};

// イベント一覧取得 API のプロフィール DTO。
export type EventListItemProfile = {
  id: string;
  displayName: string;
  avatarUrl: string;
};

// イベント一覧取得 API のイベント DTO。
export type EventListItem = {
  createdAt: string;
  endDate: string;
  eventDate: string;
  id: string;
  location: string;
  profileId: string;
  title: string;
  profile: EventListItemProfile;
  tags?: TagItem[];
  // イベントが取りやめになった日時(RFC3339)。未設定(null/undefined)の場合は開催予定。
  cancelledAt?: string | null;
};

// イベント一覧取得 API のレスポンス DTO。
export type EventListResponse = {
  events: EventListItem[];
  limit: number;
  offset: number;
  totalCount: number;
};

// イベント一覧取得 API のリクエストパラメータ DTO。
export type EventListRequest = {
  sort?: "created_at" | "event_date";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
  // 検索キーワードの配列（AND 検索・最大10語）。
  keywords?: string[];
  // 絞り込むタグIDの配列（UUID・OR 検索・最大20件）。
  tagIds?: string[];
};

// イベント詳細取得 API のレスポンス DTO。
export type EventDetailResponse = {
  capacity: number;
  // 参加の取り消し期限(RFC3339)。未設定の場合は期限なしとして扱う。
  cancelDeadline?: string | null;
  costs: EventDetailCost[];
  createdAt: string;
  // 現在申込中の参加人数の合計。定員未設定（capacity=0）でも返す。
  // 定員がある場合の残り人数は capacity - participantCount で算出する。
  participantCount: number;
  description: string;
  eventDate: string;
  // 終了日時(RFC3339)。作成時に省略されてもサーバー側で eventDate と同値が補完されるため、
  // 詳細レスポンスでは常に存在する。
  endDate: string;
  externalUrl?: string;
  id: string;
  imageObjectKeys: string[];
  imageFilenames: string[];
  imageUrls: string[];
  items: EventDetailItem[];
  location: string;
  pdfObjectKeys: string[];
  pdfFilenames: string[];
  pdfUrls: string[];
  profile: EventDetailProfile;
  reports?: EventDetailReport[];
  tags?: TagItem[];
  title: string;
  updatedAt: string;
};

// イベント参加者への一斉通知 API のリクエスト/レスポンス DTO
export type NotifyEventParticipantsRequest = {
  // 通知件名
  subject: string;
  // 通知本文（必須）
  body: string;
};

export type NotifyEventParticipantsResponse = {
  // 実際に通知された参加者数（任意）
  notifiedCount?: number;
};

// イベント取りやめ（キャンセル）API（POST /api/v1/events/{id}/cancel）の DTO 群。
// 主催者のみ実行可能。参加者へ送る通知メールの件名・本文を任意で受け取り、
// キャンセル確定と同一トランザクションで通知を outbox に予約する
// （バックグラウンドワーカーが個別送信する）。
export type CancelEventRequest = {
  // 通知メールの件名（任意）
  subject?: string;
  // 通知メールの本文（任意）
  body?: string;
};

// キャンセルエンドポイントの成功(200)レスポンス DTO。
export type CancelEventResponse = {
  // キャンセル確定したイベントの UUID。
  id: string;
  // キャンセル受領日時(RFC3339)。
  cancelledAt: string;
};

// ============================================
// マイページ／プロフィールページ API の DTO 群
// ============================================

// マイページ取得 API（GET /api/v1/me/events）の件数 DTO。
export type MyEventCounts = {
  applied: number;
  attended: number;
  hosted: number;
};

// マイページ取得 API のレスポンス DTO。
export type MyEventListResponse = {
  counts: MyEventCounts;
  events: EventListItem[];
  limit: number;
  offset: number;
  totalCount: number;
};

// プロフィールページ取得 API（GET /api/v1/profiles/:id/events）の件数 DTO。
export type ProfileEventCounts = {
  attended: number;
  hosted: number;
};

// プロフィールページ取得 API のレスポンス DTO。
export type ProfileEventListResponse = {
  counts: ProfileEventCounts;
  events: EventListItem[];
  limit: number;
  offset: number;
  totalCount: number;
};

// マイページ API の type パラメータ。
export type MyEventType = "hosted" | "applied" | "attended";

// プロフィールページ API の type パラメータ。
export type ProfileEventType = "hosted" | "attended";
