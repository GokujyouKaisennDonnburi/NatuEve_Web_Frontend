// このファイルは、イベント参加申込の内容プレビューモックエンドポイントを定義する。
// GET /api/v1/events/:id/join/preview?token=...（認証不要・ADR-0049 フォローアップ）。
// 確認画面が確定ボタンを押す前に申込内容を表示するために使う読み取り専用の呼び出しで、
// トークンは消費しない。無効・期限切れ・使用済みは 400 invalid_request、
// イベント不存在は 404 を返す。
import { HttpResponse, http } from "msw";

import { mockEventDetails } from "./data";
import { findPendingMemberByToken, removePendingMember } from "./participation";

// 確認トークンが無効・期限切れ・使用済みの場合の共通レスポンス。
const invalidTokenResponse = () =>
  HttpResponse.json(
    {
      error: {
        code: "invalid_request",
        message: "確認リンクが無効か、有効期限が切れています",
      },
    },
    { status: 400 },
  );

export const eventJoinPreviewHandler = http.get(
  "/api/v1/events/:id/join/preview",
  ({ request, params }) => {
    const id = String(params?.id ?? "");
    const detail = mockEventDetails.get(id);

    // イベントが存在しない場合は 404 を返す。
    if (!detail) {
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

    const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
    if (!token) {
      return invalidTokenResponse();
    }

    const found = findPendingMemberByToken(id, token);
    if (!found) {
      return invalidTokenResponse();
    }

    // 期限切れの pending は遅延削除して無効として扱う（確定と同じ）。
    if (new Date(found.pending.expiresAt).getTime() <= Date.now()) {
      removePendingMember(id, found.mailKey);
      return invalidTokenResponse();
    }

    // 確定前の申込内容のみを返す。トークンは消費しない。
    return HttpResponse.json({
      participants: found.pending.participants,
      partySize: found.pending.partySize,
    });
  },
);
