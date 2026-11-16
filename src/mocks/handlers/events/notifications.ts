// このファイルは、イベント参加者への一斉通知モックエンドポイントを定義する。
// POST /api/v1/events/:id/notifications。要認証。
import { HttpResponse, http } from "msw";

import {
  EVENT_NOTIFICATION_WINDOW_HOURS,
  MAX_EVENT_NOTIFICATION_RECIPIENTS,
  MAX_EVENT_NOTIFICATION_SENDS,
  MAX_NOTIFICATION_BODY_LENGTH,
  MAX_NOTIFICATION_SUBJECT_LENGTH,
} from "@/constants/config";
import { validateNotificationText } from "@/utils/notificationText";
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

    const payload = (await request.json().catch(() => null)) as {
      subject?: unknown;
      body?: unknown;
    } | null;

    if (
      typeof payload?.subject !== "string" ||
      typeof payload.body !== "string"
    ) {
      return invalidRequest("リクエストボディが不正です");
    }
    const subject = validateNotificationText(
      payload.subject,
      MAX_NOTIFICATION_SUBJECT_LENGTH,
    );
    if (!subject.value) return invalidRequest("件名は必須です");
    if (subject.tooLong)
      return invalidRequest(
        `件名は${MAX_NOTIFICATION_SUBJECT_LENGTH}文字以内で入力してください`,
      );
    const body = validateNotificationText(
      payload.body,
      MAX_NOTIFICATION_BODY_LENGTH,
    );
    if (!body.value) return invalidRequest("本文は必須です");
    if (body.tooLong)
      return invalidRequest(
        `本文は${MAX_NOTIFICATION_BODY_LENGTH}文字以内で入力してください`,
      );

    const event = mockEventDetails.get(id);
    // 実APIの主催者確認では、存在しないイベントIDも 400 (invalid_request) として扱う。
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

    // グループで申し込んでも、送信先は代表者のメールアドレス1件。
    const recipientCount = eventMembers.get(id)?.length ?? 0;
    if (recipientCount === 0) return invalidRequest("送信先の参加者がいません");
    if (recipientCount > MAX_EVENT_NOTIFICATION_RECIPIENTS) {
      return invalidRequest(
        `送信先の参加者が多すぎます（上限${MAX_EVENT_NOTIFICATION_RECIPIENTS}件）`,
      );
    }

    const now = Date.now();
    // 日付が変わっても一斉リセットはせず、各送信から24時間経った分だけ枠を戻す。
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
    // 入力・権限・宛先・回数のいずれかで拒否したリクエストは送信枠を消費しない。
    sendTimesByEvent.set(id, [...recent, now]);

    return HttpResponse.json({
      eventId: id,
      recipientCount,
      sentCount: recipientCount,
      failedCount: 0,
    } satisfies NotifyEventParticipantsResponse);
  },
);
