import { apiFetch } from "@/services/apiClient";
import {
  ContactError,
  type CreateContactErrorBody,
  type CreateContactRequest,
  type CreateContactResponse,
} from "@/types/contact";

// お問い合わせ送信 API（POST /api/v1/contact）を呼ぶ。
//
// 未認証の窓口のため auth を無効化する（Authorization を付けない）。
// 成功時は 202（outbox への受付完了）を返す。
// 検証エラー（400）・受付上限（429）等は ContactError を送出し、
// 呼び出し側で API 由来のエラーかどうかを判別できるようにする。
export async function createContact(
  payload: CreateContactRequest,
): Promise<CreateContactResponse> {
  const response = await apiFetch("/api/v1/contact", {
    method: "POST",
    auth: false,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // バックエンドは { error: { code, message } } 形式でエラー詳細を返す。
    // code と message を取得できれば toast 表示に活かす。
    // 取得失敗時（ネットワークエラーの TypeError 等はここを通らない）はステータスでフォールバック。
    let code = "internal_error";
    let message: string | undefined;
    try {
      const body = (await response.json()) as CreateContactErrorBody;
      code = body?.error?.code ?? code;
      message = body?.error?.message;
    } catch {
      // JSON 以外のボディ（gin 既定の 404 テキスト等）は無視する
    }

    throw new ContactError(
      code,
      message ??
        `お問い合わせの送信に失敗しました (Status: ${response.status})`,
      response.status,
    );
  }

  return (await response.json()) as CreateContactResponse;
}
