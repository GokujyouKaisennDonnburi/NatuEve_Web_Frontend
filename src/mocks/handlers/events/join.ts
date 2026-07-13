// このファイルは、イベント参加モックエンドポイントを定義する。
// POST /api/v1/events/:id/join
// 認証は任意。Authorization ヘッダなし → 匿名参加（profileId = null）。
// ヘッダありで有効な Bearer → profileId を記録してログイン参加。
// 同一イベントへの重複参加は 409 already_joined、定員超過は 409 capacity_full で返す。
import { HttpResponse, http } from "msw";

import type { MockParticipationLog } from "./participation";
import {
  eventMembers,
  eventParticipants,
  participationLogs,
} from "./participation";
import { mockEventDetails } from "./data";

export const eventJoinHandler = http.post(
  "/api/v1/events/:id/join",
  async ({ request, params }) => {
    const id = String(params?.id ?? "");

    // イベントが存在しない場合は404エラーを返す
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

    // リクエストボディを取得する（本番 ParticipateEventRequest と同じ契約）
    const body = (await request.json()) as {
      mailAddress?: unknown;
      username?: unknown;
      partySize?: unknown;
    };

    // 本番のサーバー側バリデーションを模し、必須項目が欠ける場合は 400 を返す
    const hasMailAddress =
      typeof body.mailAddress === "string" && body.mailAddress.length > 0;
    const hasUsername =
      typeof body.username === "string" && body.username.length > 0;
    const hasValidPartySize =
      typeof body.partySize === "number" &&
      Number.isInteger(body.partySize) &&
      body.partySize >= 1;

    // 必須項目が欠けている場合は400エラーを返す
    if (!hasMailAddress || !hasUsername || !hasValidPartySize) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message:
              "メールアドレス・ユーザー名・参加人数（1以上の整数）は必須です",
          },
        },
        { status: 400 },
      );
    }

    const mailAddress = body.mailAddress as string;
    const username = body.username as string;
    const partySize = body.partySize as number;

    // 定員チェック：イベントの定員が設定されている場合は、
    // 参加人数が定員を超える場合は 409 capacity_full を返す
    const detail = mockEventDetails.get(id);
    if (
      typeof detail?.capacity === "number" &&
      detail.capacity >= 1 &&
      partySize > detail.capacity
    ) {
      return HttpResponse.json(
        {
          error: {
            code: "capacity_full",
            message: "定員に達しています",
          },
        },
        { status: 409 },
      );
    }

    // 認証ヘッダの有無で profileId を決定
    // ヘッダなし → 匿名参加（profileId = null）
    // ヘッダあり（Bearer） → トークンを profileId として流用（モック限定ハック）
    const authorizationHeader = request.headers.get("authorization");
    const hasBearer = Boolean(authorizationHeader?.startsWith("Bearer "));
    const profileId = hasBearer
      ? (authorizationHeader?.split(" ")[1]?.trim() ?? null)
      : null;

    // 重複参加チェック：ログイン時は profileId、匿名時は mailAddress で識別
    const participantKey = profileId ?? `anon:${mailAddress}`;
    const participants = eventParticipants.get(id) ?? new Set<string>();
    if (participants.has(participantKey)) {
      return HttpResponse.json(
        {
          error: {
            code: "already_joined",
            message: "既に参加しています",
          },
        },
        { status: 409 },
      );
    }
    participants.add(participantKey);
    eventParticipants.set(id, participants);

    // 申込日時を1回だけ生成し、参加者一覧と受領レスポンスの両方に使い回す。
    // id が廃止され createdAt が識別・表示の重要情報になったため、同一申込で
    // タイムスタンプがズレないよう単一の値で整合性を保つ。
    const createdAt = new Date().toISOString();

    // participation-logs エンドポイントが返す参加履歴を記録する。
    const logs =
      participationLogs.get(id) ?? new Map<string, MockParticipationLog>();
    logs.set(participantKey, { action: "join", updatedAt: createdAt });
    participationLogs.set(id, logs);

    // members エンドポイントで参加者一覧に反映されるよう、参加レコードを蓄積する。
    const members = eventMembers.get(id) ?? [];
    members.push({
      username,
      mailAddress,
      partySize,
      profileId,
      createdAt,
    });
    eventMembers.set(id, members);

    // 受領レスポンスを返す（本番 ParticipateEventResponse と同じ契約）
    return HttpResponse.json(
      {
        eventId: id,
        mailAddress,
        username,
        partySize,
        profileId,
        createdAt,
      },
      { status: 201 },
    );
  },
);
