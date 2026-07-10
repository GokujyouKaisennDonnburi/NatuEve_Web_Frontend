import { apiFetch } from "@/services/apiClient";
import type {
  EventMembersResponse,
  GetEventMembersErrorBody,
  GetParticipationLogsErrorBody,
  JoinedCancelErrorBody,
  JoinedCancelResponse,
  ParticipateEventErrorBody,
  ParticipateEventRequest,
  ParticipateEventResponse,
  ParticipationLogsResponse,
} from "@/types/participate";
import { ParticipateError, ParticipationLogsError } from "@/types/participate";
import { JoinedCancelError } from "@/types/participate";

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

// イベント参加者一覧取得 API（GET /api/v1/events/{eventId}/members）を呼ぶ（要認証・主催者のみ）。
//
// 主催者以外は 403 となる。APIエラー・通信エラーは例外を送出し、呼び出し側で
// エラー表示に切り替えられるようにする。
export async function getEventMembers(
  eventId: string,
): Promise<EventMembersResponse> {
  const response = await apiFetch(
    `/api/v1/events/${encodeURIComponent(eventId)}/members`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    // バックエンドは { error: { code, message } } 形式でエラー詳細を返す。
    // message を取得できれば呼び出し側の表示に活かす。取得失敗時はステータスでフォールバック。
    let message: string | undefined;
    try {
      const body = (await response.json()) as GetEventMembersErrorBody;
      message = body?.error?.message;
    } catch {
      // JSON 以外のボディは無視する
    }

    throw new Error(
      message ?? `参加者一覧の取得に失敗しました (Status: ${response.status})`,
    );
  }

  return (await response.json()) as EventMembersResponse;
}

// イベント参加状態取得 API（GET /api/v1/events/{eventId}/participation-logs）を呼ぶ（要認証）。
//
// 現在のログインユーザーが当該イベントに参加中かどうかを判定する。
// 未認証・無効トークンは 401、イベント不存在は 400 invalid_request となる。
// APIエラー・通信エラーは ParticipationLogsError を送出し、呼び出し側で
// エラー表示に切り替えられるようにする。
export async function getParticipationLogs(
  eventId: string,
): Promise<ParticipationLogsResponse> {
  const response = await apiFetch(
    `/api/v1/events/${encodeURIComponent(eventId)}/participation-logs`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    // バックエンドは { error: { code, message } } 形式でエラー詳細を返す。
    // code を取得して呼び出し側で 401 / 403 / 400 等を判別できるようにする。
    let code = "internal_error";
    let message: string | undefined;
    try {
      const body = (await response.json()) as GetParticipationLogsErrorBody;
      code = body?.error?.code ?? code;
      message = body?.error?.message;
    } catch {
      // JSON 以外のボディは無視する
    }

    throw new ParticipationLogsError(
      code,
      message ?? `参加状態の取得に失敗しました (Status: ${response.status})`,
      response.status,
    );
  }

  return (await response.json()) as ParticipationLogsResponse;
}

// イベント参加キャンセル API（POST /api/v1/events/{eventId}/joined-cancel）を呼ぶ（要認証）。
//
// 参加済みユーザーが参加をキャンセルする。リクエストボディは不要。
// 未認証・無効トークンは 401、未参加時は 409 not_joined となる。
// APIエラー・通信エラーは JoinedCancelError を送出し、呼び出し側で
// エラー表示に切り替えられるようにする。
export async function joinedCancel(
  eventId: string,
): Promise<JoinedCancelResponse> {
  const response = await apiFetch(
    `/api/v1/events/${encodeURIComponent(eventId)}/joined-cancel`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    // バックエンドは { error: { code, message } } 形式でエラー詳細を返す。
    // code を取得して呼び出し側で 401 / 409 等を判別できるようにする。
    let code = "internal_error";
    let message: string | undefined;
    try {
      const body = (await response.json()) as JoinedCancelErrorBody;
      code = body?.error?.code ?? code;
      message = body?.error?.message;
    } catch {
      // JSON 以外のボディは無視する
    }

    throw new JoinedCancelError(
      code,
      message ?? `参加キャンセルに失敗しました (Status: ${response.status})`,
      response.status,
    );
  }

  return (await response.json()) as JoinedCancelResponse;
}
