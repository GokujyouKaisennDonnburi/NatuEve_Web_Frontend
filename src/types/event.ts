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
  // 定員（任意・0=未設定・正数=定員）。
  capacity?: number;
  // 関連URL（任意・255文字以内・http/https）。
  externalUrl?: string;
  // 費用内訳（1件以上必須）。
  costs: EventCostInput[];
  // 持ち物リスト（任意）。
  items?: EventItemInput[];
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

// イベント詳細取得 API のレスポンス DTO。
export type EventDetailResponse = {
  capacity: number;
  costs: EventDetailCost[];
  createdAt: string;
  description: string;
  eventDate: string;
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
  title: string;
  updatedAt: string;
};
