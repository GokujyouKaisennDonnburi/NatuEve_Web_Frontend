import { apiFetch } from "@/services/apiClient";
import type {
  CreateTagRequest,
  CreateTagResponse,
  TagErrorBody,
  TagListResponse,
} from "@/types/tag";
import { TagError } from "@/types/tag";

// タグ作成 API（POST /api/v1/tags）を呼ぶ（要認証）。
//
// タグ入力欄で Enter 押下 / 追加ボタン押下時に呼び出される。
// 検証エラー（400）・重複（409）・サーバーエラー（500）は TagError を送出し、
// 呼び出し側で重複成功扱いにするかエラー表示にするかを判別できるようにする。
export async function createTag(
  payload: CreateTagRequest,
): Promise<CreateTagResponse> {
  const response = await apiFetch("/api/v1/tags", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // バックエンドは { error: { code, message } } 形式でエラー詳細を返す。
    // code を取得して呼び出し側で 409 duplicate_tag 等を判別できるようにする。
    let code = "internal_error";
    let message: string | undefined;
    try {
      const body = (await response.json()) as TagErrorBody;
      code = body?.error?.code ?? code;
      message = body?.error?.message;
    } catch {
      // JSON 以外のボディは無視する
    }

    throw new TagError(
      code,
      message ?? `タグ作成に失敗しました (Status: ${response.status})`,
      response.status,
    );
  }

  return (await response.json()) as CreateTagResponse;
}

// タグ一覧取得 API（GET /api/v1/tags）を呼ぶ（認証不要）。
//
// タグ入力欄の候補表示のために呼び出される。
// 取得失敗時は呼び出し側で適宜フォールバックする。
export async function getTags(): Promise<TagListResponse> {
  const response = await apiFetch("/api/v1/tags", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`タグ一覧の取得に失敗しました (Status: ${response.status})`);
  }

  return (await response.json()) as TagListResponse;
}
