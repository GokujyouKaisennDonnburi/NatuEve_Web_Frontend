import { apiFetch } from "@/services/apiClient";
import type {
  ParticipateEventErrorBody,
  ParticipateEventRequest,
  ParticipateEventResponse,
} from "@/types/participate";
import { ParticipateError } from "@/types/participate";

// イベント参加 API（POST /api/v1/events/{eventId}/join）を呼ぶ。
//
// 認証は任意。ログイン時は `auth: true` で Bearer トークンを付与し profileId が記録される。
// 未ログイン時は `auth: false` でトークン無しで送信し、匿名参加（profileId = null）となる。
// ヘッダありでトークンが無効の場合は 401 で中断される。
// 検証エラー（400）や 409 Conflict 等は ParticipateError を送出し、呼び出し側で判別する。
export async function participateEvent(
  eventId: string,
  payload: ParticipateEventRequest,
  options: { auth?: boolean } = {},
): Promise<ParticipateEventResponse> {
  const { auth = true } = options;

  const response = await apiFetch(
    `/api/v1/events/${encodeURIComponent(eventId)}/join`,
    {
      method: "POST",
      auth,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    // バックエンドは { error: { code, message } } 形式でエラー詳細を返す。
    // code を取得して呼び出し側で 409 Conflict 等を判別できるようにする。
    let code = "internal_error";
    let message: string | undefined;
    try {
      const body = (await response.json()) as ParticipateEventErrorBody;
      code = body?.error?.code ?? code;
      message = body?.error?.message;
    } catch {
      // JSON 以外のボディは無視する
    }

    // ParticipateError を送出して呼び出し側で判別できるようにする
    throw new ParticipateError(
      code,
      message ?? `参加申し込みに失敗しました (Status: ${response.status})`,
      response.status,
    );
  }

  return (await response.json()) as ParticipateEventResponse;
}
