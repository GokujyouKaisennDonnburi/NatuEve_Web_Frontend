// このファイルは、イベント詳細取得モックエンドポイントを定義する。
import { HttpResponse, http } from "msw";

import { mockEventDetails } from "./data";
import { eventMembers } from "./participation";

export const eventDetailHandler = http.get(
  "/api/v1/events/:id",
  ({ params }) => {
    const id = String(params?.id ?? "");
    const found = mockEventDetails.get(id);
    if (!found) {
      return HttpResponse.json(
        { error: { code: "not_found", message: "イベントが見つかりません" } },
        { status: 404 },
      );
    }

    // 現在の合計参加人数と残り人数を算出して返す。
    const members = eventMembers.get(id) ?? [];
    const currentParticipants = members.reduce(
      (sum, member) => sum + member.partySize,
      0,
    );
    const capacity = found.capacity ?? 0;
    const remainingParticipants =
      capacity > 0 ? Math.max(capacity - currentParticipants, 0) : 0;

    // 詳細フィールドを付与して返す（投稿時のフォーマットを模倣）
    return HttpResponse.json({
      ...found,
      currentParticipants,
      remainingParticipants,
    });
  },
);
