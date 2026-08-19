// このファイルは、イベント参加モックエンドポイントを定義する。
// POST /api/v1/events/:id/join
// 認証は任意。Authorization ヘッダなし → 匿名参加（profile = null）。
// ヘッダありで有効な Bearer → プロフィールを記録してログイン参加。
// 同一イベントへの重複参加は 409 already_joined、定員超過は 409 capacity_full で返す。
import { HttpResponse, http } from "msw";

import type { ParticipationCostBreakdown } from "@/types/participate";
import type { MockParticipationLog } from "./participation";
import {
  eventMembers,
  eventParticipants,
  participationLogs,
} from "./participation";
import { mockEventDetails } from "./data";
import {
  TOKEN_TO_PROFILE,
  getBearerToken,
  hasBearerToken,
  unauthorizedResponse,
} from "./auth";

// イベントの費用カテゴリ（costs）へ、申し込み人数（partySize）を先頭のカテゴリから
// 多めに配分し、末尾へ向かって減らす「階段状」の内訳を組み立てる。
//
// 実 API では申し込み時に選択されたカテゴリ別の内訳をそのまま保存・返却する想定だが、
// 参加 API のリクエストボディ（ParticipateEventRequest）は partySize（合計人数）のみを
// 受け取り、カテゴリ別の内訳はサーバーへ送信されない。そのためモックでは、
// 送信されない内訳をイベントの費用カテゴリへの配分によって再現している。
const buildCostBreakdown = (
  costs: { category: string; cost: number }[],
  partySize: number,
): ParticipationCostBreakdown[] => {
  // カテゴリが1件だけの場合は、そのカテゴリに全人数を入れる。
  if (costs.length === 1) {
    return [
      { category: costs[0].category, cost: costs[0].cost, count: partySize },
    ];
  }

  let remaining = partySize;
  return costs.map((cost, index) => {
    const remainingCategories = costs.length - index;
    // 残りカテゴリ数に応じて先頭側が多くなるよう繰り上げで配分し、
    // 最後のカテゴリには残り全部（0名になる場合もある）を割り当てる。
    const count =
      remainingCategories === 1
        ? remaining
        : Math.min(
            remaining,
            Math.ceil((remaining * 2) / (remainingCategories + 1)),
          );
    remaining -= count;
    return { category: cost.category, cost: cost.cost, count };
  });
};

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

    // 認証ヘッダの有無で参加者のプロフィールを決定する。
    // ヘッダなし → 匿名参加（profile = null）
    // ヘッダあり（Bearer） → 既知トークンならそのプロフィールでログイン参加
    const authorizationHeader = request.headers.get("authorization");
    const hasBearer = hasBearerToken(authorizationHeader);
    const token = hasBearer ? getBearerToken(authorizationHeader) : "";

    // Authorization ヘッダが Bearer 形式でも既知トークンでない場合は 401。
    // 参加者一覧に載せる profile もここで引いた値をそのまま使う。
    // 別々に引き直すと、片方だけ引けなかったときに
    // 「認証は通ったのに匿名参加として記録される」状態を作ってしまう。
    const profile = hasBearer ? (TOKEN_TO_PROFILE[token] ?? null) : null;
    if (hasBearer && !profile) {
      return unauthorizedResponse();
    }

    const profileId = profile?.id ?? null;

    // 重複参加チェック：ログイン時は token、匿名時は mailAddress で識別
    const participantKey = hasBearer ? token : `anon:${mailAddress}`;
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

    // 申し込み内訳（カテゴリ別人数）を組み立てる。
    // イベントの費用カテゴリが取得できない場合は costs を保存しない
    // （＝表示側が内訳ブロックを省略する）。
    const eventCosts = detail?.costs;
    const costBreakdown =
      eventCosts && eventCosts.length > 0
        ? buildCostBreakdown(eventCosts, partySize)
        : undefined;

    // participation-logs エンドポイントが返す参加履歴を記録する。
    const logs =
      participationLogs.get(id) ?? new Map<string, MockParticipationLog>();
    logs.set(participantKey, {
      action: "join",
      updatedAt: createdAt,
      partySize,
      costs: costBreakdown,
    });
    participationLogs.set(id, logs);

    // members エンドポイントで参加者一覧に反映されるよう、参加レコードを蓄積する。
    // 参加者一覧はプロフィールサマリーを返す契約のため、匿名参加は null とする。
    const members = eventMembers.get(id) ?? [];
    members.push({
      username,
      mailAddress,
      partySize,
      profile,
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
