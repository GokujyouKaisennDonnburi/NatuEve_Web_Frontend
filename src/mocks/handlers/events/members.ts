// このファイルは、イベント参加者一覧取得モックエンドポイントを定義する。
// GET /api/v1/events/:id/members
// 主催者のみ閲覧可能。主催者以外は 403、未認証・未知トークンは 401 を返す。
// トークン→profileId は TOKEN_TO_PROFILE_ID で明示的に対応付け、
// 未知トークンをそのまま profileId として扱う認可バイパスを防ぐ。
// swagger に合わせ、イベント不存在は 400 invalid_request（兄弟エンドポイントと統一）。
import { HttpResponse, http } from "msw";

import { eventMembers } from "./participation";
import { mockEventDetails } from "./data";
import {
  TOKEN_TO_PROFILE_ID,
  getBearerToken,
  hasBearerToken,
  unauthorizedResponse,
} from "./auth";

export const eventMembersHandler = http.get(
  "/api/v1/events/:id/members",
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

    const event = mockEventDetails.get(id);
    if (!event) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "リクエストが不正です",
          },
        },
        { status: 400 },
      );
    }

    if (event.profileId !== requesterProfileId) {
      return HttpResponse.json(
        {
          error: {
            code: "forbidden",
            message: "主催者のみ閲覧できます",
          },
        },
        { status: 403 },
      );
    }

    const members = eventMembers.get(id) ?? [];
    const totalCount = members.length;
    const totalMembers = members.reduce(
      (sum, member) =>
        sum + (Number.isFinite(member.partySize) ? member.partySize : 0),
      0,
    );

    return HttpResponse.json({ members, totalCount, totalMembers });
  },
);
