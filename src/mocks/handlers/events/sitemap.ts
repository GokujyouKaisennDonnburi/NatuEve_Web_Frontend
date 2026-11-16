// このファイルは、sitemap 用イベント一覧取得モックエンドポイントを定義する。
import { HttpResponse, http } from "msw";

import { mockEvents } from "./data";

// mock に updatedAt は無いため、固定値を返す。
const MOCK_UPDATED_AT = "2026-01-01T00:00:00Z";

export const eventSitemapHandler = http.get("/api/v1/sitemap/events", () => {
  return HttpResponse.json(
    mockEvents.map((event) => ({ id: event.id, updatedAt: MOCK_UPDATED_AT })),
  );
});
