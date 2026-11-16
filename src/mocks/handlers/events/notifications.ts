// このファイルは、イベント参加者への一斉通知モックエンドポイントを定義する。
// POST /api/v1/events/:id/notifications。要認証。
import { HttpResponse, http } from "msw";

import {
  EVENT_NOTIFICATION_WINDOW_HOURS,
  MAX_EVENT_NOTIFICATION_SENDS,
} from "@/constants/config";
import { MESSAGES } from "@/constants/messages";
import { NotificationLimitExceededError } from "@/types/event";
import { mockEventDetails } from "./data";
import {
  TOKEN_TO_PROFILE_ID,
  getBearerToken,
  hasBearerToken,
  unauthorizedResponse,
} from "./auth";

const sendTimesByEvent = new Map<string, number[]>();
const sendWindowMs = EVENT_NOTIFICATION_WINDOW_HOURS * 60 * 60 * 1000;

export const eventNotificationHandler = http.post(
  "/api/v1/events/:id/notifications",
  async ({ request, params }) => {
    const id = String(params?.id ?? "");
    const authorizationHeader = request.headers.get("authorization");

    if (!hasBearerToken(authorizationHeader)) {
      return unauthorizedResponse();
    }

    const token = getBearerToken(authorizationHeader);
    if (!TOKEN_TO_PROFILE_ID[token]) {
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

    if (
      typeof body?.subject !== "string" ||
      !body.subject.trim() ||
      typeof body.body !== "string" ||
      !body.body.trim()
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

    const now = Date.now();
    const recent = (sendTimesByEvent.get(id) ?? []).filter(
      (sentAt) => sentAt > now - sendWindowMs,
    );
    if (recent.length >= MAX_EVENT_NOTIFICATION_SENDS) {
      return HttpResponse.json(
        {
          error: {
            code: NotificationLimitExceededError.code,
            message: MESSAGES.NOTIFICATION_LIMIT_EXCEEDED,
          },
        },
        { status: 429 },
      );
    }
    sendTimesByEvent.set(id, [...recent, now]);

    return HttpResponse.json({
      eventId: id,
      recipientCount: 0,
      sentCount: 0,
      notifiedCount: 0,
      failedCount: 0,
    });
  },
);
