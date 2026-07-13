// このファイルは、イベント参加者への一斉通知モックエンドポイントを定義する。
// POST /api/v1/events/:id/notifications。要認証。
import { HttpResponse, http } from "msw";

import { mockEventDetails } from "./data";
import { unauthorizedResponse } from "./auth";

export const eventNotificationHandler = http.post(
  "/api/v1/events/:id/notifications",
  async ({ request, params }) => {
    const id = String(params?.id ?? "");
    const authorizationHeader = request.headers.get("authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return unauthorizedResponse();
    }

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

    const body = (await request.json().catch(() => ({}))) as {
      subject?: unknown;
      body?: unknown;
    };

    if (typeof body.subject !== "string" || body.subject.length === 0) {
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

    return HttpResponse.json({
      eventId: id,
      recipientCount: 0,
      sentCount: 0,
      notifiedCount: 0,
      failedCount: 0,
    });
  },
);
