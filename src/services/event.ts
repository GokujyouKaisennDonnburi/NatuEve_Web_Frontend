import { apiFetch } from "@/services/apiClient";
import type {
  CancelEventRequest,
  CancelEventResponse,
  CreateEventRequest,
  CreateEventResponse,
  EventDetailResponse,
  EventListRequest,
  EventListResponse,
  MyEventListResponse,
  MyEventType,
  NotifyEventParticipantsRequest,
  NotifyEventParticipantsResponse,
  ProfileEventListResponse,
  ProfileEventType,
} from "@/types/event";

// イベント詳細取得 API（GET /api/v1/events/{id}）を呼ぶ（認証不要）。
//
// 失敗した場合は例外を送出し、呼び出し側の処理を中断させる。
export async function getEventDetail(
  eventId: string,
): Promise<EventDetailResponse> {
  const response = await apiFetch(
    `/api/v1/events/${encodeURIComponent(eventId)}`,
    { auth: false },
  );

  if (!response.ok) {
    throw new Error(
      `イベント詳細の取得に失敗しました (Status: ${response.status})`,
    );
  }

  return (await response.json()) as EventDetailResponse;
}

// URLSearchParams に変換するヘルパー。
const buildEventListParams = (request: EventListRequest): URLSearchParams => {
  const params = new URLSearchParams();

  if (request.sort) {
    params.set("sort", request.sort);
  }
  if (request.order) {
    params.set("order", request.order);
  }
  if (request.limit != null) {
    params.set("limit", request.limit.toString());
  }
  if (request.offset != null) {
    params.set("offset", request.offset.toString());
  }
  if (request.keywords) {
    for (const keyword of request.keywords) {
      params.append("q", keyword);
    }
  }
  if (request.tagIds) {
    for (const tagId of request.tagIds) {
      params.append("tagId", tagId);
    }
  }
  if (request.status) {
    for (const status of request.status) {
      params.append("status", status);
    }
  }

  return params;
};

// イベント一覧取得 API（GET /api/v1/events）を呼ぶ（認証任意）。
//
// 未ログインでも取得可能だが、ログイン済みの場合はAuthorizationヘッダーを付与する。
// 失敗した場合は例外を送出し、呼び出し側の処理を中断させる。
export async function fetchEventList(
  request: EventListRequest,
): Promise<EventListResponse> {
  const params = buildEventListParams(request);
  const response = await apiFetch(`/api/v1/events?${params.toString()}`);

  if (!response.ok) {
    throw new Error(
      `イベント一覧の取得に失敗しました (Status: ${response.status})`,
    );
  }

  return (await response.json()) as EventListResponse;
}

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

// クエリパラメータをビルドする内部ヘルパー（sort / order / limit / offset）。
const buildPaginationParams = (params?: {
  sort?: "created_at" | "event_date";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}): URLSearchParams => {
  const searchParams = new URLSearchParams();
  if (params?.sort) searchParams.set("sort", params.sort);
  if (params?.order) searchParams.set("order", params.order);
  if (params?.limit != null) searchParams.set("limit", params.limit.toString());
  if (params?.offset != null)
    searchParams.set("offset", params.offset.toString());
  return searchParams;
};

// マイページ用イベント一覧取得 API（GET /api/v1/me/events）を呼ぶ（要認証）。
//
// type は必須（hosted|applied|attended）。認証済みユーザー自身のイベントを種別ごとに返す。
// counts には3種別すべての件数が常に含まれる。
// 失敗した場合は例外を送出し、呼び出し側の処理を中断させる。
export async function fetchMyEvents(
  type: MyEventType,
  params?: {
    sort?: "created_at" | "event_date";
    order?: "asc" | "desc";
    limit?: number;
    offset?: number;
  },
): Promise<MyEventListResponse> {
  const searchParams = buildPaginationParams(params);
  searchParams.set("type", type);
  const response = await apiFetch(
    `/api/v1/me/events?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(
      `マイページのイベント一覧取得に失敗しました (Status: ${response.status})`,
    );
  }

  return (await response.json()) as MyEventListResponse;
}

// プロフィールページ用イベント一覧取得 API（GET /api/v1/profiles/{id}/events）を呼ぶ（認証不要）。
//
// type は必須（hosted|attended）。指定したユーザーのイベントを種別ごとに返す。
// counts には公開する2種別の件数が常に含まれる。
// 存在しないユーザーIDの場合は 404 となるため例外を送出する。
export async function fetchProfileEvents(
  profileId: string,
  type: ProfileEventType,
  params?: {
    sort?: "created_at" | "event_date";
    order?: "asc" | "desc";
    limit?: number;
    offset?: number;
  },
): Promise<ProfileEventListResponse> {
  const searchParams = buildPaginationParams(params);
  searchParams.set("type", type);
  const response = await apiFetch(
    `/api/v1/profiles/${encodeURIComponent(profileId)}/events?${searchParams.toString()}`,
    { auth: false },
  );

  if (!response.ok) {
    throw new Error(
      `プロフィールページのイベント一覧取得に失敗しました (Status: ${response.status})`,
    );
  }

  return (await response.json()) as ProfileEventListResponse;
}
