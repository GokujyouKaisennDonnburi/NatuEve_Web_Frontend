// このファイルは、イベント一覧取得モックエンドポイントを定義する。
import { HttpResponse, http } from "msw";

import { getPagedEvents } from "./data";

export const eventListHandler = http.get("/api/v1/events", ({ request }) => {
  return HttpResponse.json(getPagedEvents(new URL(request.url)));
});
