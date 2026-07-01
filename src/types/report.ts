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
  // 関連URL（任意・255文字以内・http/https）。
  externalUrl?: string;
  // 画像オブジェクトキーの一覧（任意）。
  imageObjectKeys?: string[];
  // PDF オブジェクトキーの一覧（任意・各要素255文字以内）。
  pdfObjectKeys?: string[];
};

// レポート作成エンドポイントのレスポンス DTO。
export type CreateReportResponse = {
  // 生成されたレポートの UUID。
  id: string;
  // レコード作成日時(RFC3339)。
  createdAt: string;
};
