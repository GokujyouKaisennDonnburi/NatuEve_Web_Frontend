// お問い合わせ送信 API（POST /api/v1/contact）の DTO 群。
// バックエンド（NatuEve_API）と
// フィールド名・型を一致させる。

// お問い合わせのカテゴリ。NatuEve_API の model.ContactCategory と一致させる。
export type ContactCategory = "request" | "bug" | "other";

// お問い合わせ送信エンドポイントへのリクエストボディ DTO。認証不要。
export type CreateContactRequest = {
  // お問い合わせ内容（必須）。
  category: ContactCategory;
  // 詳細（任意）。前後の空白はバックエンドで除去され、2000 文字以内。
  message: string;
};

// お問い合わせ送信エンドポイントのレスポンス DTO。
// メール配信完了ではなく outbox への受付完了を表す（ADR-0052）。
export type CreateContactResponse = {
  // 受付したカテゴリ。
  category: ContactCategory;
  // 受付した詳細。前後の空白は除去された値。
  message: string;
  // 受付日時(RFC3339)。
  receivedAt: string;
};

// お問い合わせ送信 API のエラーレスポンスボディ DTO。
export type CreateContactErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

// お問い合わせ送信 API のエラー。code とステータスを保持し、
// 呼び出し側で API 由来のエラーを判別できるようにする。
export class ContactError extends Error {
  readonly code: string;
  readonly status: number;

  // コンストラクタ
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ContactError";
    this.code = code;
    this.status = status;
  }
}
