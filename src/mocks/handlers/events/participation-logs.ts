// このファイルは、イベント参加状態取得モックエンドポイントを定義する。
// GET /api/v1/events/:id/participation-logs
// 認証ユーザー自身の、指定イベントに対する最新の参加状態を返す。要認証。
// 申し込み内容（カテゴリ別内訳・申込日時）は members/me が担当する。
// 未認証・未知トークンは 401、イベント不存在は 404 not_found（swagger準拠）。
// 履歴がない場合は action=null, participating=false, updatedAt=null を返す（200）。
import { HttpResponse, http } from "msw";

import { participationLogs } from "./participation";
import { mockEventDetails } from "./data";
import {
  TOKEN_TO_PROFILE_ID,
  getBearerToken,
  hasBearerToken,
  unauthorizedResponse,
} from "./auth";

export const eventParticipationLogsHandler = http.get(
  "/api/v1/events/:id/participation-logs",
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

    // participationLogs から最新の参加履歴を取得する。
    // participantKey は join エンドポイントが raw token で登録するため、
    // ここでも raw token で判定する。
    const log = participationLogs.get(id)?.get(token) ?? null;
    const action = log?.action ?? null;
    const updatedAt = log?.updatedAt ?? null;
    const participating = action === "join";
    const partySize =
      participating && typeof log?.partySize === "number"
        ? log.partySize
        : undefined;

    // 申し込み内訳はこのエンドポイントでは返さない。
    // 内訳は GET /api/v1/events/:id/members/me が担当する。
    return HttpResponse.json({
      action,
      participating,
      partySize,
      updatedAt,
    });
  },
);
