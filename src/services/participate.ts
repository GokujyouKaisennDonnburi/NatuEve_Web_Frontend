import { apiFetch } from "@/services/apiClient";
import type {
  AbsenceErrorBody,
  AbsenceRequest,
  AbsenceResponse,
  EventMembersResponse,
  GetEventMembersErrorBody,
  GetMyEventApplicationErrorBody,
  GetParticipationLogsErrorBody,
  LeaveErrorBody,
  LeaveResponse,
  MyEventApplicationResponse,
  ParticipateEventErrorBody,
  ParticipateEventRequest,
  ParticipateEventResponse,
  ParticipationLogsResponse,
} from "@/types/participate";
import {
  AbsenceError,
  LeaveError,
  MyEventApplicationError,
  ParticipateError,
  ParticipationLogsError,
} from "@/types/participate";

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

// イベント参加キャンセル API（POST /api/v1/events/{eventId}/leave）を呼ぶ（要認証）。
//
// ログイン参加者が参加を取り消す。リクエストボディは不要。
// 未認証・無効トークンは 401、イベント不存在 または 未参加時は 404 not_found となる。
// 匿名参加（profileId=null）は本 API の対象外。
// APIエラー・通信エラーは LeaveError を送出し、呼び出し側で
// エラー表示に切り替えられるようにする。
export async function leaveEvent(eventId: string): Promise<LeaveResponse> {
  const response = await apiFetch(
    `/api/v1/events/${encodeURIComponent(eventId)}/leave`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    // バックエンドは { error: { code, message } } 形式でエラー詳細を返す。
    // code を取得して呼び出し側で 401 / 404 等を判別できるようにする。
    let code = "internal_error";
    let message: string | undefined;
    try {
      const body = (await response.json()) as LeaveErrorBody;
      code = body?.error?.code ?? code;
      message = body?.error?.message;
    } catch {
      // JSON 以外のボディは無視する
    }

    throw new LeaveError(
      code,
      message ?? `参加キャンセルに失敗しました (Status: ${response.status})`,
      response.status,
    );
  }

  return (await response.json()) as LeaveResponse;
}

// 自分の申込内容取得 API（GET /api/v1/events/{eventId}/members/me）を呼ぶ（要認証）。
//
// 認証ユーザー自身が当該イベントへ申し込んだ内容（名前・メールアドレス・人数の内訳・申込日時）を返す。
// 未認証・無効トークンは 401、イベント不存在 または 未申込・キャンセル済み・匿名申込は
// 404 not_found となる（404 の2種は code が同じで message でしか区別できない）。
// APIエラー・通信エラーは MyEventApplicationError を送出し、呼び出し側で判別できるようにする。
export async function getMyEventApplication(
  eventId: string,
): Promise<MyEventApplicationResponse> {
  const response = await apiFetch(
    `/api/v1/events/${encodeURIComponent(eventId)}/members/me`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    // バックエンドは { error: { code, message } } 形式でエラー詳細を返す。
    // code を取得して呼び出し側で 401 / 404 等を判別できるようにする。
    let code = "internal_error";
    let message: string | undefined;
    try {
      const body = (await response.json()) as GetMyEventApplicationErrorBody;
      code = body?.error?.code ?? code;
      message = body?.error?.message;
    } catch {
      // JSON 以外のボディは無視する
    }

    throw new MyEventApplicationError(
      code,
      message ?? `申込内容の取得に失敗しました (Status: ${response.status})`,
      response.status,
    );
  }

  return (await response.json()) as MyEventApplicationResponse;
}

// 欠席連絡 API（POST /api/v1/events/{eventId}/absence）を呼ぶ（要認証）。
//
// 申込期限を過ぎたイベントで、参加を取り消したうえで主催者へ欠席を伝える。
// 期限内の取り消しは leaveEvent が担当し、こちらは期限後の導線でのみ使う。
// 未認証は 401、イベント不存在・未参加は 404、reason / detail の不正は 400 となる。
// APIエラー・通信エラーは AbsenceError を送出し、呼び出し側で判別できるようにする。
export async function reportAbsence(
  eventId: string,
  payload: AbsenceRequest,
): Promise<AbsenceResponse> {
  const response = await apiFetch(
    `/api/v1/events/${encodeURIComponent(eventId)}/absence`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    // バックエンドは { error: { code, message } } 形式でエラー詳細を返す。
    // code を取得して呼び出し側で 404 NotFound 等を判別できるようにする。
    let code = "internal_error";
    let message: string | undefined;
    try {
      const body = (await response.json()) as AbsenceErrorBody;
      code = body?.error?.code ?? code;
      message = body?.error?.message;
    } catch {
      // JSON 以外のボディは無視する
    }

    throw new AbsenceError(
      code,
      message ?? `欠席の連絡に失敗しました (Status: ${response.status})`,
      response.status,
    );
  }

  return (await response.json()) as AbsenceResponse;
}
