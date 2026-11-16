import { setupServer } from "msw/node";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { eventJoinHandler } from "@/mocks/handlers/events/join";
import { eventJoinConfirmHandler } from "@/mocks/handlers/events/join-confirm";
import { eventJoinPreviewHandler } from "@/mocks/handlers/events/join-preview";
import {
  cancelledEventIds,
  CONFIRM_TOKEN_TTL_MS,
  eventMembers,
  eventParticipants,
  findPendingMemberByToken,
  participationLogs,
  pendingEventMembers,
  seedEventMembers,
  seedPendingJoin,
} from "@/mocks/handlers/events/participation";
import { MOCK_AUTH_SESSION } from "@/services/mockAuth";

// ADR-0049（ゲスト参加申込の確認メール確定方式）を再現したモックの挙動を検証する。
// join と confirm のハンドラーを実際に HTTP で往復させ、画面が依存する契約を確認する。

const server = setupServer(
  eventJoinHandler,
  eventJoinConfirmHandler,
  eventJoinPreviewHandler,
);

// 追加のダミーイベント（index 1）。キャンセルされておらず、開催日も未来。
const EVENT_ID = "00000000-0000-4000-8000-000000000002";
// 終了済みのダミーイベント（index 3）。
const ENDED_EVENT_ID = "00000000-0000-4000-8000-000000000004";
const MISSING_EVENT_ID = "00000000-0000-4000-8000-0000000000ff";

const guestJoinBody = {
  mailAddress: "guest-test@example.com",
  username: "テストゲスト",
  participants: [{ category: "大人", headCount: 2 }],
};

// MSW は相対パスのハンドラーを jsdom の location.origin 基準で解決するため、
// リクエストも同じ origin に合わせる。
const origin = () => window.location.origin;

const postJoin = (
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
  eventId: string = EVENT_ID,
) =>
  fetch(`${origin()}/api/v1/events/${eventId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

const postConfirm = (token: string, eventId: string = EVENT_ID) =>
  fetch(`${origin()}/api/v1/events/${eventId}/join/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

const postPreview = (token: string, eventId: string = EVENT_ID) =>
  fetch(`${origin()}/api/v1/events/${eventId}/join/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

const futureDate = () =>
  new Date(Date.now() + CONFIRM_TOKEN_TTL_MS).toISOString();

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  server.resetHandlers();
  eventMembers.clear();
  eventParticipants.clear();
  participationLogs.clear();
  pendingEventMembers.clear();
  cancelledEventIds.clear();
});

describe("モック: ゲスト参加申込", () => {
  it("201 で応答し、未確定として保存して参加者一覧には載せない", async () => {
    const response = await postJoin(guestJoinBody);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      eventId: EVENT_ID,
      mailAddress: guestJoinBody.mailAddress,
      username: guestJoinBody.username,
      partySize: 2,
      profileId: null,
    });

    const pending = pendingEventMembers.get(EVENT_ID);
    expect(pending?.size).toBe(1);
    expect(eventMembers.get(EVENT_ID) ?? []).toHaveLength(0);
    expect(participationLogs.get(EVENT_ID)).toBeUndefined();
  });

  it("申込済みのメールアドレスでも同じ 201 を返し、既存の申込内容を返さない", async () => {
    const first = await postJoin(guestJoinBody);
    expect(first.status).toBe(201);

    const secondBody = {
      mailAddress: guestJoinBody.mailAddress,
      username: "別の名前",
      participants: [{ category: "大人", headCount: 1 }],
    };
    const second = await postJoin(secondBody);

    expect(second.status).toBe(201);
    await expect(second.json()).resolves.toMatchObject({
      username: "別の名前",
      partySize: 1,
      profileId: null,
    });

    // 未確定の申込は最初の内容のまま変わらない（トークン期限まで再申込をブロック）。
    const pending = pendingEventMembers.get(EVENT_ID)?.values().next().value;
    expect(pending?.username).toBe(guestJoinBody.username);
    expect(pending?.partySize).toBe(2);
  });

  it("期限切れの未確定申込は再申込をブロックせず、新しい未確定申込を作る", async () => {
    seedPendingJoin(EVENT_ID, {
      token: "expired-token",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      username: "期限切れ",
      mailAddress: guestJoinBody.mailAddress,
      partySize: 1,
      participants: [{ category: "大人", headCount: 1 }],
    });

    const response = await postJoin(guestJoinBody);

    expect(response.status).toBe(201);
    const pendings = pendingEventMembers.get(EVENT_ID);
    expect(pendings?.size).toBe(1);
    const pending = pendings?.values().next().value;
    expect(pending?.token).not.toBe("expired-token");
    expect(pending?.username).toBe(guestJoinBody.username);
    expect(findPendingMemberByToken(EVENT_ID, "expired-token")).toBeNull();
  });
});

describe("モック: ログイン参加申込", () => {
  const authHeaders = {
    Authorization: `Bearer ${MOCK_AUTH_SESSION.token}`,
  };
  const memberBody = {
    mailAddress: MOCK_AUTH_SESSION.email ?? "",
    username: MOCK_AUTH_SESSION.name ?? "",
    participants: [{ category: "大人", headCount: 2 }],
  };

  it("従来どおり 201 で即時確定し、参加者一覧に載る", async () => {
    const response = await postJoin(memberBody, authHeaders);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      profileId: MOCK_AUTH_SESSION.userId,
    });
    expect(eventMembers.get(EVENT_ID)).toHaveLength(1);
  });

  it("同一プロフィールの重複申込は 409 already_joined", async () => {
    expect((await postJoin(memberBody, authHeaders)).status).toBe(201);

    const duplicate = await postJoin(memberBody, authHeaders);

    expect(duplicate.status).toBe(409);
    await expect(duplicate.json()).resolves.toMatchObject({
      error: { code: "already_joined" },
    });
  });

  it("同一メールの未確定申込がある場合も 409 とし、未確定の申込は残す", async () => {
    seedPendingJoin(EVENT_ID, {
      token: "pending-token",
      expiresAt: futureDate(),
      username: "ゲスト",
      mailAddress: memberBody.mailAddress,
      partySize: 1,
      participants: [{ category: "大人", headCount: 1 }],
    });

    const response = await postJoin(memberBody, authHeaders);

    expect(response.status).toBe(409);
    expect(pendingEventMembers.get(EVENT_ID)?.size).toBe(1);
  });

  it("期限切れの未確定申込はログイン参加の重複判定に含めない", async () => {
    seedPendingJoin(EVENT_ID, {
      token: "expired-token",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      username: "期限切れ",
      mailAddress: memberBody.mailAddress,
      partySize: 1,
      participants: [{ category: "大人", headCount: 1 }],
    });

    const response = await postJoin(memberBody, authHeaders);

    expect(response.status).toBe(201);
  });
});

describe("モック: 参加申込の確定", () => {
  const seedPending = (token: string, partySize = 2) =>
    seedPendingJoin(EVENT_ID, {
      token,
      expiresAt: futureDate(),
      username: "確定テスト",
      mailAddress: "confirm-test@example.com",
      partySize,
      participants: [{ category: "大人", headCount: partySize }],
    });

  it("200 で確定し、参加者一覧に載る。同じトークンは単回使用で 400", async () => {
    seedPending("known-token");

    const response = await postConfirm("known-token");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      eventId: EVENT_ID,
      participants: [{ category: "大人", headCount: 2 }],
      partySize: 2,
    });
    expect(eventMembers.get(EVENT_ID)).toHaveLength(1);
    expect(findPendingMemberByToken(EVENT_ID, "known-token")).toBeNull();

    const second = await postConfirm("known-token");
    expect(second.status).toBe(400);
    await expect(second.json()).resolves.toMatchObject({
      error: { code: "invalid_request" },
    });
  });

  it("期限切れのトークンは 400 となり、未確定の申込も削除される", async () => {
    seedPendingJoin(EVENT_ID, {
      token: "expired-token",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      username: "期限切れ",
      mailAddress: "expired@example.com",
      partySize: 1,
      participants: [{ category: "大人", headCount: 1 }],
    });

    const response = await postConfirm("expired-token");

    expect(response.status).toBe(400);
    expect(findPendingMemberByToken(EVENT_ID, "expired-token")).toBeNull();
  });

  it("不正なトークンは 400", async () => {
    const response = await postConfirm("unknown-token");

    expect(response.status).toBe(400);
  });

  it("イベントが存在しない場合は 404", async () => {
    const response = await postConfirm("known-token", MISSING_EVENT_ID);

    expect(response.status).toBe(404);
  });

  it("確定済みの申込で定員を超える場合は 409 capacity_full となり、未確定の申込は残る", async () => {
    seedEventMembers(EVENT_ID, 30);
    seedPending("capacity-token", 1);

    const response = await postConfirm("capacity-token");

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "capacity_full" },
    });
    expect(findPendingMemberByToken(EVENT_ID, "capacity-token")).not.toBeNull();
  });

  it("終了済みイベントは 409 event_ended", async () => {
    seedPendingJoin(ENDED_EVENT_ID, {
      token: "ended-token",
      expiresAt: futureDate(),
      username: "終了テスト",
      mailAddress: "ended@example.com",
      partySize: 1,
      participants: [{ category: "大人", headCount: 1 }],
    });

    const response = await postConfirm("ended-token", ENDED_EVENT_ID);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "event_ended" },
    });
  });

  it("取消済みイベントは 409 event_cancelled", async () => {
    cancelledEventIds.add(EVENT_ID);
    seedPending("cancelled-token");

    const response = await postConfirm("cancelled-token");

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "event_cancelled" },
    });
  });
});

describe("モック: 申込内容プレビュー", () => {
  const seedPreviewPending = (token: string) =>
    seedPendingJoin(EVENT_ID, {
      token,
      expiresAt: futureDate(),
      username: "プレビューテスト",
      mailAddress: "preview-test@example.com",
      partySize: 3,
      participants: [
        { category: "大人", headCount: 2 },
        { category: "子ども", headCount: 1 },
      ],
    });

  it("有効なトークンで 200 となり、確定前の申込内容を返す", async () => {
    seedPreviewPending("preview-token");

    const response = await postPreview("preview-token");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      participants: [
        { category: "大人", headCount: 2 },
        { category: "子ども", headCount: 1 },
      ],
      partySize: 3,
    });
  });

  it("プレビューはトークンを消費せず、その後も確定できる", async () => {
    seedPreviewPending("preview-once-token");

    const preview = await postPreview("preview-once-token");
    expect(preview.status).toBe(200);

    const confirm = await postConfirm("preview-once-token");
    expect(confirm.status).toBe(200);
  });

  it("不正なトークンは 400", async () => {
    const response = await postPreview("unknown-token");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "invalid_request" },
    });
  });

  it("トークンはリクエストボディで受け取り、クエリパラメータは読まない", async () => {
    seedPreviewPending("body-only-token");

    // クエリにだけトークンを付けても、ボディが無いため無効として扱われる。
    const response = await fetch(
      `${origin()}/api/v1/events/${EVENT_ID}/join/preview?token=body-only-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "invalid_request" },
    });
  });

  it("期限切れのトークンは 400 となり、未確定の申込も削除される", async () => {
    seedPendingJoin(EVENT_ID, {
      token: "expired-preview-token",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      username: "期限切れ",
      mailAddress: "expired-preview@example.com",
      partySize: 1,
      participants: [{ category: "大人", headCount: 1 }],
    });

    const response = await postPreview("expired-preview-token");

    expect(response.status).toBe(400);
    expect(
      findPendingMemberByToken(EVENT_ID, "expired-preview-token"),
    ).toBeNull();
  });

  it("イベントが存在しない場合は 404", async () => {
    seedPreviewPending("preview-missing-event-token");

    const response = await postPreview(
      "preview-missing-event-token",
      MISSING_EVENT_ID,
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "not_found" },
    });
  });
});
