// このファイルは、自分の申込内容取得モックエンドポイントを定義する。
// GET /api/v1/events/:id/members/me
// 認証ユーザー自身の、指定イベントへの申込内容を返す。要認証。
// 呼び出し元が本人なので profileId は返さない。金額も返さず、参加費の表示は
// 呼び出し側がイベント詳細の costs[] と category で突合して補う。
//
// {id} が UUID として不正なら 400、未認証・未知トークンは 401。
// イベント不存在 と 未申込・キャンセル済み・匿名申込 はどちらも 404 not_found で、
// message でしか区別できない（POST /events/:id/leave の流儀に合わせている）。
import { HttpResponse, http } from "msw";

import { participationLogs } from "./participation";
import { mockEventDetails } from "./data";
import {
  TOKEN_TO_PROFILE_ID,
  getBearerToken,
  hasBearerToken,
  unauthorizedResponse,
} from "./auth";

// UUID 形式の判定。バックエンドがパスパラメータを UUID としてパースするため、
// 形式不正は本番同様に 400 invalid_request で弾く。
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 404 not_found の共通レスポンス。message だけが2種を区別する。
const notFoundResponse = (message: string) =>
  HttpResponse.json({ error: { code: "not_found", message } }, { status: 404 });

export const eventMyApplicationHandler = http.get(
  "/api/v1/events/:id/members/me",
  ({ request, params }) => {
    const id = String(params?.id ?? "");
    const authorizationHeader = request.headers.get("authorization");

    if (!UUID_PATTERN.test(id)) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "イベントIDが不正です",
          },
        },
        { status: 400 },
      );
    }

    if (!hasBearerToken(authorizationHeader)) {
      return unauthorizedResponse();
    }

    const token = getBearerToken(authorizationHeader);
    const requesterProfileId = TOKEN_TO_PROFILE_ID[token];
    if (!requesterProfileId) {
      return unauthorizedResponse();
    }

    if (!mockEventDetails.has(id)) {
      return notFoundResponse("イベントが見つかりません");
    }

    // 参加履歴は join エンドポイントが raw token をキーに登録するため、ここでも raw token で引く。
    // 直近が leave（取り消し済み）・履歴なし（未申込）はどちらも「参加していない」として扱う。
    const log = participationLogs.get(id)?.get(token);
    if (log?.action !== "join") {
      return notFoundResponse("このイベントに参加していません");
    }

    // 契約どおりカテゴリ名の昇順で返す。申込時の入力順のままにはしない。
    const participants = [...(log.participants ?? [])].sort((a, b) =>
      a.category.localeCompare(b.category, "ja"),
    );

    // partySize は内訳の合計と必ず一致させる。
    const partySize = participants.reduce(
      (total, participant) => total + participant.headCount,
      0,
    );

    return HttpResponse.json({
      eventId: id,
      username: log.username ?? "",
      mailAddress: log.mailAddress ?? "",
      partySize,
      participants,
      createdAt: log.createdAt ?? log.updatedAt,
    });
  },
);
