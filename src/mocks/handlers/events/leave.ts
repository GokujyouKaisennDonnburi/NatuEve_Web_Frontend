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
    // partySize / participants（申し込み内訳）は持ち越さない。取り消し後は
    // 「参加していない」状態として扱うため、あえて指定せず undefined のままにする。
    const logs =
      participationLogs.get(id) ?? new Map<string, MockParticipationLog>();
    logs.set(participantKey, { action: "leave", updatedAt: canceledAt });
    participationLogs.set(id, logs);

    // eventMembers からも該当レコードを削除する。
    // ログイン参加の場合は profile.id（= TOKEN_TO_PROFILE_ID[token]）で特定する。
    // 匿名参加は profile が null のため、常に残る（本エンドポイントの対象外）。
    const members = eventMembers.get(id);
    if (members) {
      const updatedMembers = members.filter(
        (member) => member.profile?.id !== requesterProfileId,
      );
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
