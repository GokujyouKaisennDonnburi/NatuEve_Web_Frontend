// このファイルは、イベント取りやめ（キャンセル）モックエンドポイントを定義する。
// POST /api/v1/events/:id/cancel。要認証。非冪等: 既にキャンセル済みのイベントに
// 対する呼び出しは 409 を返す。
import { HttpResponse, http } from "msw";

import { cancelledEventIds } from "./participation";
import { mockEventDetails, mockEvents } from "./data";
import {
  TOKEN_TO_PROFILE_ID,
  getBearerToken,
  hasBearerToken,
  unauthorizedResponse,
} from "./auth";

export const eventCancelHandler = http.post(
  "/api/v1/events/:id/cancel",
  async ({ request, params }) => {
    const id = String(params?.id ?? "");
    const authorizationHeader = request.headers.get("authorization");

    // 認証トークンが無効な場合は401エラーを返す
    if (!hasBearerToken(authorizationHeader)) {
      return unauthorizedResponse();
    }

    const token = getBearerToken(authorizationHeader);
    if (!TOKEN_TO_PROFILE_ID[token]) {
      return unauthorizedResponse();
    }

    // イベントが存在しない場合は 404 を返す
    if (!mockEventDetails.has(id)) {
      return HttpResponse.json(
        {
          error: {
            code: "not_found",
            message: "イベントが見つかりません",
          },
        },
        { status: 404 },
      );
    }

    // 非冪等: 既にキャンセル済みのイベントに対する呼び出しは 409 を返す。
    if (cancelledEventIds.has(id)) {
      return HttpResponse.json(
        {
          error: {
            code: "conflict",
            message: "このイベントは既にキャンセルされています",
          },
        },
        { status: 409 },
      );
    }

    // リクエストボディを取得する。本番 CancelEventRequest と同じ契約を想定する。
    const body = (await request.json().catch(() => ({}))) as {
      subject?: unknown;
      body?: unknown;
    };

    // リクエストボディの subject と body は文字列で必須。空文字も不正とする。
    if (
      typeof body.subject !== "string" ||
      body.subject.length === 0 ||
      typeof body.body !== "string" ||
      body.body.length === 0
    ) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "リクエストボディが不正です",
          },
        },
        { status: 400 },
      );
    }

    // キャンセル確定をデータへ反映し、一覧/詳細の再取得でキャンセル状態が再現されるようにする。
    cancelledEventIds.add(id);
    const cancelledAt = new Date().toISOString();
    const mockEvent = mockEvents.find((event) => event.id === id);
    if (mockEvent) {
      mockEvent.cancelledAt = cancelledAt;
    }
    const mockEventDetail = mockEventDetails.get(id);
    if (mockEventDetail) {
      mockEventDetail.cancelledAt = cancelledAt;
    }

    return HttpResponse.json({
      id,
      cancelledAt,
    });
  },
);
