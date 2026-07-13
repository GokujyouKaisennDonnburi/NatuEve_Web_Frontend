// このファイルは、イベント詳細取得モックエンドポイントを定義する。
import { HttpResponse, http } from "msw";

import { mockEventDetails } from "./data";

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

    // 詳細フィールドを付与して返す（投稿時のフォーマットを模倣）
    return HttpResponse.json(found);
  },
);
