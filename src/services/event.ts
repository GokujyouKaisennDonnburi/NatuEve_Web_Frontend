import { apiFetch } from "@/services/apiClient";
import type {
  CreateEventRequest,
  CreateEventResponse,
  NotifyEventParticipantsRequest,
  NotifyEventParticipantsResponse,
} from "@/types/event";

// イベント作成 API（POST /api/v1/events）を呼ぶ（要認証）。
//
// 画像/PDF は事前に presign → R2 直 PUT 済みで、payload には objectKey のみを渡す。
// 検証エラー（400）等は response.ok=false となり、ここで例外を送出して呼び出し側の
// submit を中断させる。
export async function createEvent(
  payload: CreateEventRequest,
): Promise<CreateEventResponse> {
  const response = await apiFetch("/api/v1/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`イベント作成に失敗しました (Status: ${response.status})`);
  }

  return (await response.json()) as CreateEventResponse;
}

/**
 * イベント削除 API (DELETE /api/v1/events/:eventId) を呼ぶ (要認証)。
 *
 * 削除に失敗した場合は例外を送出し、呼び出し側の処理を中断させる。
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const response = await apiFetch(
    `/api/v1/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error(`イベント削除に失敗しました (Status: ${response.status})`);
  }
}

/**
 * イベント参加者への一斉通知 API (POST /api/v1/events/{id}/notifications) を呼ぶ (要認証)。
 *
 * 通知に失敗した場合は例外を送出し、呼び出し側の処理を中断させる。
 * @param eventId イベントID
 * @param payload 通知内容（件名と本文）
 */
export async function notifyEventParticipants(
  eventId: string,
  payload: NotifyEventParticipantsRequest,
): Promise<NotifyEventParticipantsResponse> {
  const response = await apiFetch(
    `/api/v1/events/${encodeURIComponent(eventId)}/notifications`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const body: { error?: { message?: string } } = await response
      .json()
      .catch(() => ({}));
    throw new Error(
      body.error?.message ??
        `通知の送信に失敗しました (Status: ${response.status})`,
    );
  }

  return (await response.json()) as NotifyEventParticipantsResponse;
}
