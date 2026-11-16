// このファイルは、イベント参加者への一斉通知モックエンドポイントを定義する。
// POST /api/v1/events/:id/notifications。要認証。
import { HttpResponse, http } from "msw";

import {
  EVENT_NOTIFICATION_WINDOW_HOURS,
  MAX_EVENT_NOTIFICATION_SENDS,
} from "@/constants/config";
import {
  NotificationLimitExceededError,
  type NotifyEventParticipantsResponse,
} from "@/types/event";
import { mockEventDetails } from "./data";
import { eventMembers } from "./participation";
import {
  TOKEN_TO_PROFILE_ID,
  getBearerToken,
  hasBearerToken,
  unauthorizedResponse,
} from "./auth";

const sendTimesByEvent = new Map<string, number[]>();
const sendWindowMs = EVENT_NOTIFICATION_WINDOW_HOURS * 60 * 60 * 1000;
const maxRecipients = 100;

const invalidRequest = (message: string) =>
  HttpResponse.json(
    { error: { code: "invalid_request", message } },
    { status: 400 },
  );

export function resetNotificationSendTimes(): void {
  sendTimesByEvent.clear();
}

export const eventNotificationHandler = http.post(
  "/api/v1/events/:id/notifications",
  async ({ request, params }) => {
    const id = String(params?.id ?? "");
    const authorizationHeader = request.headers.get("authorization");

    if (!hasBearerToken(authorizationHeader)) {
      return unauthorizedResponse();
    }

    const token = getBearerToken(authorizationHeader);
    const requesterProfileId = TOKEN_TO_PROFILE_ID[token];
    if (!requesterProfileId) {
      return unauthorizedResponse();
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
      return invalidRequest("リクエストボディが不正です");
    }

    const event = mockEventDetails.get(id);
    if (!event) return invalidRequest("指定されたイベントが存在しません");
    if (event.profileId !== requesterProfileId) {
      return HttpResponse.json(
        {
          error: {
            code: "forbidden",
            message: "このイベントを操作する権限がありません",
          },
        },
        { status: 403 },
      );
    }

    // 宛先は参加人数ではなく申込ごとに1件。不正な送信は回数に含めない。
    const recipientCount = eventMembers.get(id)?.length ?? 0;
    if (recipientCount === 0) return invalidRequest("送信先の参加者がいません");
    if (recipientCount > maxRecipients) {
      return invalidRequest(
        `送信先の参加者が多すぎます（上限${maxRecipients}件）`,
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
            message: `このイベントの送信回数が上限（${EVENT_NOTIFICATION_WINDOW_HOURS}時間あたり${MAX_EVENT_NOTIFICATION_SENDS}回）に達しました。しばらく待ってから再度お試しください`,
          },
        },
        { status: 429 },
      );
    }
    sendTimesByEvent.set(id, [...recent, now]);

    return HttpResponse.json({
      eventId: id,
      recipientCount,
      sentCount: recipientCount,
      failedCount: 0,
    } satisfies NotifyEventParticipantsResponse);
  },
);
