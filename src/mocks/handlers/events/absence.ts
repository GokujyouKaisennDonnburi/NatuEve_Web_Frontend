// このファイルは、欠席連絡モックエンドポイントを定義する。
// POST /api/v1/events/:id/absence
// 申込期限を過ぎた参加者が、主催者へ欠席を連絡する。要認証。匿名参加は対象外。
// 参加行を削除し、参加状態ログへ action=absence を1件（理由・補足つきで）追記する。
// 本番はこれに加えて主催者宛メールを予約するが、モックでは送信までは再現しない。
//
// {id} が UUID として不正・JSON が壊れている・reason が既定値以外・
// detail が上限超過なら 400、未認証・未知トークンは 401、
// イベント不存在 または 未参加は 404 not_found となる。
// 申込期限前（before_deadline）・開催終了後（event_ended）・
// 取りやめ済み（event_cancelled）はいずれも 409 で受け付けない。
// 申込期限が未設定のイベントは「期限前」に当たらず、開催終了まで受け付ける。
import { HttpResponse, http } from "msw";

import { ABSENCE_REASONS } from "@/types/participate";
import type { AbsenceReason } from "@/types/participate";

import type { MockParticipationLog } from "./participation";
import {
  eventMembers,
  eventParticipants,
  participationLogs,
} from "./participation";
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

// detail（欠席理由の補足）の最大文字数（trim 後の長さで判定する）。
const DETAIL_MAX_LENGTH = 200;

const invalidRequestResponse = (message: string) =>
  HttpResponse.json(
    { error: { code: "invalid_request", message } },
    { status: 400 },
  );

// 404 not_found の共通レスポンス。message だけが2種を区別する。
const notFoundResponse = (message: string) =>
  HttpResponse.json({ error: { code: "not_found", message } }, { status: 404 });

// 409 の共通レスポンス。イベントの状態によって code を出し分ける。
const conflictResponse = (code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status: 409 });

const isAbsenceReason = (value: unknown): value is AbsenceReason =>
  typeof value === "string" &&
  (ABSENCE_REASONS as readonly string[]).includes(value);

export const eventAbsenceHandler = http.post(
  "/api/v1/events/:id/absence",
  async ({ request, params }) => {
    const id = String(params?.id ?? "");
    const authorizationHeader = request.headers.get("authorization");

    if (!UUID_PATTERN.test(id)) {
      return invalidRequestResponse("イベントIDが不正です");
    }

    if (!hasBearerToken(authorizationHeader)) {
      return unauthorizedResponse();
    }

    const token = getBearerToken(authorizationHeader);
    const requesterProfileId = TOKEN_TO_PROFILE_ID[token];
    if (!requesterProfileId) {
      return unauthorizedResponse();
    }

    const eventDetail = mockEventDetails.get(id);
    if (!eventDetail) {
      return notFoundResponse("イベントが見つかりません");
    }

    // 参加履歴は join エンドポイントが raw token をキーに登録するため、ここでも raw token で引く。
    // 直近が join でなければ「参加していない」として 404 を返す（members/me と同じ判定）。
    const logs = participationLogs.get(id);
    if (logs?.get(token)?.action !== "join") {
      return notFoundResponse("このイベントに参加していません");
    }

    // リクエストボディは必須（中身が空の {} は可）。JSON として読めない場合は 400。
    let body: { reason?: unknown; detail?: unknown };
    try {
      body = (await request.json()) as { reason?: unknown; detail?: unknown };
    } catch {
      return invalidRequestResponse("リクエストボディが不正です");
    }

    // reason は任意。省略・null・空文字はいずれも「未指定」として扱い、
    // それ以外の値は既定の選択肢に含まれるかを検証する。
    const rawReason =
      body.reason === null || body.reason === "" ? undefined : body.reason;
    if (typeof rawReason !== "undefined" && !isAbsenceReason(rawReason)) {
      return invalidRequestResponse(
        "欠席理由（reason）は illness / family / weather_transport / other のいずれかを指定してください",
      );
    }
    const reason = isAbsenceReason(rawReason) ? rawReason : undefined;

    // detail も任意。null は未指定として扱い、文字列は前後の空白を落として検証・保存する。
    if (
      typeof body.detail !== "undefined" &&
      body.detail !== null &&
      typeof body.detail !== "string"
    ) {
      return invalidRequestResponse("欠席理由の補足（detail）が不正です");
    }
    const trimmedDetail =
      typeof body.detail === "string" ? body.detail.trim() : "";
    if (trimmedDetail.length > DETAIL_MAX_LENGTH) {
      return invalidRequestResponse(
        `欠席理由の補足（detail）は${DETAIL_MAX_LENGTH}文字以内で入力してください`,
      );
    }
    // trim して空になったものは未入力と同じ扱いにする（DB では NULL 相当）。
    const detail = trimmedDetail.length > 0 ? trimmedDetail : undefined;

    // 取りやめ済みのイベントには欠席を連絡できない。
    if (eventDetail.cancelledAt) {
      return conflictResponse(
        "event_cancelled",
        "イベントは取りやめになっています",
      );
    }

    // 開催終了後は欠席の連絡を受け付けない。
    const endDate = new Date(eventDetail.endDate || eventDetail.eventDate);
    if (!Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now()) {
      return conflictResponse("event_ended", "イベントは終了しています");
    }

    // 申込期限内は取り消し（leave）で対応できるため、欠席連絡は受け付けない。
    // 期限が未設定のイベントは「期限前」に当たらず、開催終了まで受け付ける。
    if (eventDetail.cancelDeadline) {
      const deadline = new Date(eventDetail.cancelDeadline);
      if (
        !Number.isNaN(deadline.getTime()) &&
        Date.now() < deadline.getTime()
      ) {
        return conflictResponse(
          "before_deadline",
          "申込期限内です。申し込みの取り消しをご利用ください",
        );
      }
    }

    const createdAt = new Date().toISOString();

    // 参加記録を削除して欠席連絡を受け付ける。
    const participants = eventParticipants.get(id);
    participants?.delete(token);

    // 参加履歴には理由・補足も残す。leave と同様に partySize / participants は持ち越さない。
    const nextLog: MockParticipationLog = {
      action: "absence",
      reason,
      detail,
      updatedAt: createdAt,
    };
    logs.set(token, nextLog);
    participationLogs.set(id, logs);

    // eventMembers からも該当レコードを削除する（主催者向けの参加者一覧から外す）。
    const members = eventMembers.get(id);
    if (members) {
      eventMembers.set(
        id,
        members.filter((member) => member.profile?.id !== requesterProfileId),
      );
    }

    return HttpResponse.json(
      {
        eventId: id,
        profileId: requesterProfileId,
        action: "absence",
        reason: reason ?? null,
        detail: detail ?? null,
        createdAt,
      },
      { status: 200 },
    );
  },
);
