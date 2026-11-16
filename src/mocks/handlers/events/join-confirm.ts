// このファイルは、イベント参加申込の確定モックエンドポイントを定義する。
// POST /api/v1/events/:id/join/confirm（認証不要・ADR-0049）。
// 確認メールのリンクから呼ばれ、未確定（pending）のゲスト申込をトークンで確定する。
// トークンは24時間有効・単回使用。不正・期限切れ・使用済みは 400 invalid_request、
// イベント不存在は 404、定員超過・終了・取消は 409 を返す。
import { HttpResponse, http } from "msw";

import { mockEventDetails } from "./data";
import {
  cancelledEventIds,
  eventMembers,
  eventNotFoundResponse,
  findPendingMemberByToken,
  invalidTokenResponse,
  removePendingMember,
} from "./participation";

// 確定時の競合（定員・終了・取消）の共通レスポンス。
const conflictResponse = (code: string, message: string) =>
  HttpResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status: 409 },
  );

export const eventJoinConfirmHandler = http.post(
  "/api/v1/events/:id/join/confirm",
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

    // 期限切れの pending は遅延削除して確定させない（ADR-0049）。
    if (new Date(found.pending.expiresAt).getTime() <= Date.now()) {
      removePendingMember(id, found.mailKey);
      return invalidTokenResponse();
    }

    // 取消済み・終了済みイベントは確定できない。申込期限は再確認しない。
    if (cancelledEventIds.has(id) || detail.cancelledAt) {
      return conflictResponse(
        "event_cancelled",
        "イベントは取りやめになっています",
      );
    }

    const endDate = new Date(detail.endDate || detail.eventDate);
    if (!Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now()) {
      return conflictResponse("event_ended", "イベントは終了しています");
    }

    // 確定時は確定済みの申込だけを数えて定員を再確認する。
    const totalCurrent = (eventMembers.get(id) ?? []).reduce(
      (sum, member) => sum + member.partySize,
      0,
    );
    if (
      typeof detail.capacity === "number" &&
      detail.capacity >= 1 &&
      totalCurrent + found.pending.partySize > detail.capacity
    ) {
      return conflictResponse("capacity_full", "定員に達しています");
    }

    // 単回使用: 確定したら pending を削除し、確定済みとして参加者一覧へ載せる。
    removePendingMember(id, found.mailKey);

    const confirmedAt = new Date().toISOString();
    const members = eventMembers.get(id) ?? [];
    members.push({
      username: found.pending.username,
      mailAddress: found.pending.mailAddress,
      partySize: found.pending.partySize,
      profile: null,
      createdAt: found.pending.createdAt,
    });
    eventMembers.set(id, members);

    return HttpResponse.json(
      {
        eventId: id,
        confirmedAt,
        participants: found.pending.participants,
        partySize: found.pending.partySize,
      },
      { status: 200 },
    );
  },
);
