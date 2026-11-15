// このファイルは、イベント参加モックエンドポイントを定義する。
// POST /api/v1/events/:id/join
// 認証は任意。Authorization ヘッダなし → ゲスト参加（未確定 pending・確認メール送信）。
// ヘッダありで有効な Bearer → プロフィールを記録してログイン参加（即時確定）。
// ゲストの申込済みメールアドレスからの再申込も 409 を返さず、新規と同じ 201 で応答する（ADR-0049）。
// 1回の申込人数（partySize）が上限を超える場合は 400 party_size_exceeded、
// ログイン中の重複参加は 409 already_joined、定員超過は 409 capacity_full で返す。
import { HttpResponse, http } from "msw";

import { MAX_PARTICIPATION_PARTY_SIZE } from "@/constants/config";

import {
  TOKEN_TO_PROFILE,
  getBearerToken,
  hasBearerToken,
  unauthorizedResponse,
} from "./auth";
import { mockEventDetails } from "./data";
import type { MockParticipationLog } from "./participation";
import {
  eventMembers,
  eventParticipants,
  findConfirmedMemberByMail,
  findPendingMemberByMail,
  participationLogs,
  seedPendingJoin,
} from "./participation";

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
      participants?: Array<{
        category?: unknown;
        headCount?: unknown;
      }>;
    };

    // 本番のサーバー側バリデーションを模し、必須項目が欠ける場合は 400 を返す
    const hasMailAddress =
      typeof body.mailAddress === "string" && body.mailAddress.length > 0;
    const hasUsername =
      typeof body.username === "string" && body.username.length > 0;
    const hasParticipants = Array.isArray(body.participants);

    // 必須項目が欠けている場合は400エラーを返す
    if (!hasMailAddress || !hasUsername || !hasParticipants) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message:
              "メールアドレス・ユーザー名・カテゴリ別参加人数（participants）は必須です",
          },
        },
        { status: 400 },
      );
    }

    const mailAddress = body.mailAddress as string;
    const username = body.username as string;
    // ここに到達する時点で hasParticipants（Array.isArray）で検証済みのため、
    // body.participants は配列として扱う。
    const rawParticipants = body.participants as Array<{
      category?: unknown;
      headCount?: unknown;
    }>;

    // カテゴリ別内訳のバリデーション。
    // 各エントリは category（空でない文字列）× headCount（1以上の整数）。
    // 大文字小文字は区別しない（正規化して比較）。重複・0以下の人数は 400 を返す。
    // 存在しないカテゴリ（イベント詳細の costs[].category に無い）も 400 を返す。
    const detail = mockEventDetails.get(id);
    const validCategories = (detail?.costs ?? [])
      .map((cost) => cost.category.trim().toLowerCase())
      .filter((name) => name.length > 0);

    // participants が空配列は 400。
    if (rawParticipants.length === 0) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "参加人数の内訳（participants）が空です",
          },
        },
        { status: 400 },
      );
    }

    // 各エントリの構造を検証する（重複チェック用に正規化カテゴリを記録）。
    const normalizedCategories = new Set<string>();
    let isValidParticipants = true;
    const participantEntries: Array<{ category: string; headCount: number }> =
      [];
    for (const entry of rawParticipants) {
      const { category, headCount } = entry ?? {};
      const normalized =
        typeof category === "string" ? category.trim().toLowerCase() : "";
      const isValidHeadCount =
        typeof headCount === "number" &&
        Number.isInteger(headCount) &&
        headCount >= 1;
      if (
        !normalized ||
        !isValidHeadCount ||
        normalizedCategories.has(normalized) ||
        !validCategories.includes(normalized)
      ) {
        isValidParticipants = false;
        break;
      }
      normalizedCategories.add(normalized);
      participantEntries.push({
        category: (category as string).trim(),
        headCount: headCount as number,
      });
    }
    if (!isValidParticipants) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message:
              "カテゴリはイベントの費用カテゴリに存在し、重複せず、人数は1以上の整数でなければなりません",
          },
        },
        { status: 400 },
      );
    }

    // 合計人数（partySize）は内訳からサーバー側で算出する。
    const partySize = participantEntries.reduce(
      (sum, participant) => sum + participant.headCount,
      0,
    );

    // 1回の申込人数の上限チェック。定員チェックより先に行うことで、
    // 定員が大きいイベントでも capacity_full ではなく上限超過として返す。
    if (partySize > MAX_PARTICIPATION_PARTY_SIZE) {
      return HttpResponse.json(
        {
          error: {
            code: "party_size_exceeded",
            message: `一度に申し込める人数は${MAX_PARTICIPATION_PARTY_SIZE}人までです`,
          },
        },
        { status: 400 },
      );
    }

    // 定員チェック：イベントの定員が設定されている場合は、
    // 現在の確定済み参加人数に今回の申込人数を加えた合計が定員を超える場合は 409 capacity_full を返す
    // （未確定の申込は定員を消費しない・ADR-0049）。
    const totalCurrent = (eventMembers.get(id) ?? []).reduce(
      (sum, member) => sum + member.partySize,
      0,
    );
    if (
      typeof detail?.capacity === "number" &&
      detail.capacity >= 1 &&
      totalCurrent + partySize > detail.capacity
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
    // ヘッダなし → ゲスト参加（未確定 pending）
    // ヘッダあり（Bearer） → 既知トークンならそのプロフィールでログイン参加（即時確定）
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

    // 申込日時を1回だけ生成し、参加者一覧と受領レスポンスの両方に使い回す。
    // id が廃止され createdAt が識別・表示の重要情報になったため、同一申込で
    // タイムスタンプがズレないよう単一の値で整合性を保つ。
    const createdAt = new Date().toISOString();

    if (!hasBearer) {
      // ゲスト参加: 未確定（pending）として保存し、確認トークンで確定させる。
      // 確定するまで参加者一覧・参加人数・定員判定には含めない。
      // 申込済みのメールアドレスでも 409 を返さず、新規と同じ 201 と本文で応答し、
      // 既存申込の内容（名前・人数など）は返さない（ADR-0049）。
      const existingMember =
        findConfirmedMemberByMail(id, mailAddress) ??
        findPendingMemberByMail(id, mailAddress);

      if (!existingMember) {
        // 実 API は crypto/rand の 32 バイトを base64url 化したトークンを発行する。
        // モックは確認画面との往復を再現できる一意な値で代用する。
        const pending = seedPendingJoin(id, {
          token: `mock-confirm-${crypto.randomUUID()}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          username,
          mailAddress,
          partySize,
          participants: participantEntries,
        });

        // モックは確認メールを送らないため、開発中は確認画面を開ける URL をコンソールへ出す。
        if (process.env.NEXT_PUBLIC_USE_MSW === "true") {
          const origin = typeof location !== "undefined" ? location.origin : "";
          console.info(
            `[MSW] 確認メールのリンク: ${origin}/events/${id}/join/confirm?token=${encodeURIComponent(pending.token)}`,
          );
        }
      }

      // 応答は送信内容から組み立て、既存申込の有無を判別できないようにする。
      return HttpResponse.json(
        {
          eventId: id,
          mailAddress,
          username,
          participants: participantEntries,
          partySize,
          profileId: null,
          createdAt,
        },
        { status: 201 },
      );
    }

    // ログイン参加: 従来どおり即時確定する。
    // 同一プロフィールまたは同一メールアドレスの申込が既にある場合は 409 already_joined。
    // 同一メールの pending 行がある場合も 409 とし、pending 行は削除しない（ADR-0049）。
    const participantKey = token;
    const participants = eventParticipants.get(id) ?? new Set<string>();
    if (
      participants.has(participantKey) ||
      findConfirmedMemberByMail(id, mailAddress) ||
      findPendingMemberByMail(id, mailAddress)
    ) {
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

    // participation-logs エンドポイントが返す参加履歴を記録する。
    const logs =
      participationLogs.get(id) ?? new Map<string, MockParticipationLog>();
    logs.set(participantKey, {
      action: "join",
      partySize,
      participants: participantEntries,
      username,
      mailAddress,
      createdAt,
      updatedAt: createdAt,
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
        participants: participantEntries,
        partySize,
        profileId: profile?.id ?? null,
        createdAt,
      },
      { status: 201 },
    );
  },
);
