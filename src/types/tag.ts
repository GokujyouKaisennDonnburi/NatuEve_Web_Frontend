// タグ作成 API（POST /api/v1/tags）の DTO 群。
// バックエンドの契約に合わせる。OpenAPI codegen 未導入のため participate.ts 等と同様に手書きする。

// タグ作成エンドポイントへのリクエストボディ DTO。
export type CreateTagRequest = {
  // タグ名（必須・30文字以内）。
  name: string;
};

// タグ作成エンドポイントのレスポンス DTO。
export type CreateTagResponse = {
  // タグの UUID。
  id: string;
  // タグ名。
  name: string;
};

// タグ作成 API のエラーレスポンスボディ DTO。
export type TagErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

// タグ作成 API のエラーコード（ハンドリングで区別するもの）。
export const TagErrorCode = {
  InvalidRequest: "invalid_request",
  DuplicateTag: "duplicate_tag",
  InternalError: "internal_error",
} as const;

// タグ作成 API のエラー。code を保持し、呼び出し側で 409 Conflict 等を判別できるようにする。
export class TagError extends Error {
  readonly code: string;
  readonly status: number;

  // コンストラクタ
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "TagError";
    this.code = code;
    this.status = status;
  }
}
