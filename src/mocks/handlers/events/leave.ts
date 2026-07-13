// このファイルは、イベント参加キャンセルモックエンドポイントを定義する。
// POST /api/v1/events/:id/leave
// ログイン参加者が参加を取り消す。要認証。リクエストボディは不要。匿名参加は対象外。
// 未認証・未知トークンは 401、イベント不存在 または 未参加は 404 not_found となる。
// 参加行を削除し、参加状態ログへ action=leave を1件追記する。
import { HttpResponse, http } from "msw";

import type { MockParticipationLog } from "./participation";
import {
  eventMembers,
  eventParticipants,
  participationLogs,
} from "./participation";
import { mockEventDetails } from "./data";
import {
  TOKEN_TO_PROFILE_ID,
  getBearerToken,
  hasBearerToken,
  unauthorizedResponse,
} from "./auth";

export const eventLeaveHandler = http.post(
  "/api/v1/events/:id/leave",
  ({ request, params }) => {
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

    // イベント不存在は swagger 指定により 404 not_found。
    if (!mockEventDetails.has(id)) {
      return HttpResponse.json(
        {
          error: {
            code: "not_found",
            message: "リソースが見つかりません",
          },
        },
        { status: 404 },
      );
    }

    // 未参加チェック：eventParticipants にトークンが登録されていなければ 404 not_found。
    const participants = eventParticipants.get(id);
    const participantKey = token;
    if (!participants?.has(participantKey)) {
      return HttpResponse.json(
        {
          error: {
            code: "not_found",
            message: "リソースが見つかりません",
          },
        },
        { status: 404 },
      );
    }

    // 参加記録を削除してキャンセル完了
    const canceledAt = new Date().toISOString();
    participants.delete(participantKey);
    eventParticipants.set(id, participants);

    // participation-logs エンドポイントが返す参加履歴を記録する。
    const logs =
      participationLogs.get(id) ?? new Map<string, MockParticipationLog>();
    logs.set(participantKey, { action: "leave", updatedAt: canceledAt });
    participationLogs.set(id, logs);

    // eventMembers からも該当レコードを削除する。
    // ログイン参加の場合は profileId（= TOKEN_TO_PROFILE_ID[token]）で特定する。
    const members = eventMembers.get(id);
    if (members) {
      const updatedMembers = members.filter((member) => {
        // join モックが profileId に raw token を入れる挙動と、TOKEN_TO_PROFILE_ID による userId の両方に対応する
        return (
          member.profileId !== token && member.profileId !== requesterProfileId
        );
      });
      eventMembers.set(id, updatedMembers);
    }

    return HttpResponse.json(
      {
        action: "leave",
        profileId: requesterProfileId,
        eventId: id,
        createdAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  },
);
