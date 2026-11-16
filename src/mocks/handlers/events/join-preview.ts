// このファイルは、イベント参加申込の内容プレビューモックエンドポイントを定義する。
// POST /api/v1/events/:id/join/preview（認証不要・ADR-0049 フォローアップ）。
// 確認画面が確定ボタンを押す前に申込内容を表示するために使う読み取り専用の呼び出しで、
// トークンはリクエストボディで受け取り URL には載せない（アクセスログ対策）。
// トークンは消費しない。無効・期限切れ・使用済みは 400 invalid_request、
// イベント不存在は 404 を返す。
import { HttpResponse, http } from "msw";

import { mockEventDetails } from "./data";
import {
  eventNotFoundResponse,
  findPendingMemberByToken,
  invalidTokenResponse,
  removePendingMember,
} from "./participation";

export const eventJoinPreviewHandler = http.post(
  "/api/v1/events/:id/join/preview",
  async ({ request, params }) => {
    const id = String(params?.id ?? "");
    const detail = mockEventDetails.get(id);

    // イベントが存在しない場合は 404 を返す。
    if (!detail) {
      return eventNotFoundResponse();
    }

    const body = (await request.json().catch(() => null)) as {
      token?: unknown;
    } | null;
    const token = typeof body?.token === "string" ? body.token.trim() : "";
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
