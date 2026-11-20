import { apiFetch } from "@/services/apiClient";
import type {
  CreateContactErrorBody,
  CreateContactRequest,
  CreateContactResponse,
} from "@/types/contact";

// お問い合わせ送信 API（POST /api/v1/contact）を呼ぶ。
//
// 未認証の窓口のため auth を無効化する（Authorization を付けない）。
// 成功時は 202（outbox への受付完了）を返す。
// 検証エラー（400）・受付上限（429）等は response.ok=false となり、
// ここで例外を送出して呼び出し側の submit を中断させる。
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
    // message を取得できれば toast 表示に活かす。取得失敗時はステータスでフォールバック。
    let message: string | undefined;
    try {
      const body = (await response.json()) as CreateContactErrorBody;
      message = body?.error?.message;
    } catch {
      // JSON 以外のボディは無視する
    }

    throw new Error(
      message ??
        `お問い合わせの送信に失敗しました (Status: ${response.status})`,
    );
  }

  return (await response.json()) as CreateContactResponse;
}
