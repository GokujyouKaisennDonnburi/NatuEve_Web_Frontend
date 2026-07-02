import { apiFetch } from "@/services/apiClient";
import type {
  ParticipateEventRequest,
  ParticipateEventResponse,
} from "@/types/participate";

// イベント参加申し込み API（POST /api/v1/events/:id/participate）を呼ぶ。
//
// ログイン時は `auth: true` で Bearer トークンを付与し、
// 未ログイン時は `auth: false` でトークン無しで送信する（ゲスト申し込み）。
// 検証エラー（400）等は response.ok=false となり、ここで例外を送出して呼び出し側に伝える。
export async function participateEvent(
  eventId: string,
  payload: ParticipateEventRequest,
  options: { auth?: boolean } = {},
): Promise<ParticipateEventResponse> {
  const { auth = true } = options;

  const response = await apiFetch(`/api/v1/events/${eventId}/participate`, {
    method: "POST",
    auth,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`参加申し込みに失敗しました (Status: ${response.status})`);
  }

  return (await response.json()) as ParticipateEventResponse;
}
