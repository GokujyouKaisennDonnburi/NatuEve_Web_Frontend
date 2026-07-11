import { apiFetch } from "@/services/apiClient";
import type {
  CancelEventRequest,
  CancelEventResponse,
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
 * イベント取りやめ（キャンセル）API (POST /api/v1/events/{id}/cancel) を呼ぶ (要認証)。
 *
 * 主催者のみ実行可能。非冪等: 参加者へ送る通知メールの件名・本文を必須で受け取り、
 * キャンセル確定と同一トランザクションで通知を outbox に予約する。
 * 既にキャンセル済みのイベントに対する呼び出しは 409 を返す。
 * 失敗した場合は例外を送出し、呼び出し側の処理を中断させる。
 * @param eventId イベントID
 * @param payload キャンセル通知リクエスト（件名と本文）
 */
export async function cancelEvent(
  eventId: string,
  payload: CancelEventRequest,
): Promise<CancelEventResponse> {
  const response = await apiFetch(
    `/api/v1/events/${encodeURIComponent(eventId)}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  // キャンセル API は非冪等: キャンセル確定と通知予約(outbox)を同一トランザクションで行う。
  // 件名・本文は必須。既にキャンセル済みの場合は 409 を返す。
  if (!response.ok) {
    const body: { error?: { message?: string } } = await response
      .json()
      .catch(() => ({}));
    throw new Error(
      body.error?.message ??
        `イベントの取りやめに失敗しました (Status: ${response.status})`,
    );
  }

  return (await response.json()) as CancelEventResponse;
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
