// レポート作成 API（POST /api/v1/reports）の DTO 群。
// バックエンド（NatuEve_API）と
// フィールド名・型を一致させる。

// レポート作成エンドポイントへのリクエストボディ DTO。
export type CreateReportRequest = {
  // イベントID（必須）。
  eventId: string;
  // 活動記録の文章（任意）。
  // NOTE: 外部URLのみで投稿可能にするため任意とする。
  content?: string;
  // 関連URL一覧（任意・各要素255文字以内・http/https）。
  externalUrls?: string[];
  // 画像オブジェクトキーの一覧（任意）。
  imageObjectKeys?: string[];
  // PDF オブジェクトキーの一覧（任意・各要素255文字以内）。
  pdfObjectKeys?: string[];
  // 画像の元ファイル名一覧（任意）。指定時は imageObjectKeys と同数・同順。
  imageFilenames?: string[];
  // PDF の元ファイル名一覧（任意）。指定時は pdfObjectKeys と同数・同順。
  pdfFilenames?: string[];
};

// レポート作成エンドポイントのレスポンス DTO。
export type CreateReportResponse = {
  // 生成されたレポート ID。
  reportId: string;
  // レコード作成日時(RFC3339)。
  createdAt: string;
};

// レポート作成 API のエラーレスポンスボディ DTO。
export type CreateReportErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

// レポート取得 API（GET /api/v1/events/{id}/report）のレスポンス DTO。
// 1 イベント 1 レポート。認証不要。レポート未投稿時は 404 となる。
export type ReportDetail = {
  // レポート ID。
  id: string;
  // イベントID。
  eventId: string;
  // 活動記録の文章（任意）。
  content?: string;
  // 関連URL一覧（任意）。
  externalUrls?: string[];
  // 画像オブジェクトキーの一覧（任意）。
  imageObjectKeys?: string[];
  // 画像の元ファイル名一覧（任意）。
  imageFilenames?: string[];
  // 画像の署名付き URL 一覧（任意）。
  imageUrls?: string[];
  // PDF オブジェクトキーの一覧（任意）。
  pdfObjectKeys?: string[];
  // PDF の元ファイル名一覧（任意）。
  pdfFilenames?: string[];
  // PDF の署名付き URL 一覧（任意）。
  pdfUrls?: string[];
  // レコード作成日時(RFC3339)。
  createdAt: string;
  // レコード更新日時(RFC3339)。
  updatedAt: string;
};

// レポート取得 API のエラーレスポンスボディ DTO。
export type GetReportErrorBody = CreateReportErrorBody;
