// アップロード種別。API の presign kind と一致させる（"image" | "pdf"）。
export type UploadKind = "image" | "pdf";

// presign エンドポイント（POST /api/v1/uploads/presign）へのリクエスト DTO。
export type PresignRequest = {
  kind: UploadKind;
  contentType: string;
};

// presign エンドポイントのレスポンス DTO。
export type PresignResponse = {
  // R2 tmp 領域へ直接 PUT するための署名付き URL。
  uploadUrl: string;
  // アップロード先のオブジェクトキー。イベント作成時に imageObjectKeys/pdfObjectKeys へ渡す。
  objectKey: string;
  // 署名付き URL の有効期限(RFC3339)。
  expiresAt: string;
};
