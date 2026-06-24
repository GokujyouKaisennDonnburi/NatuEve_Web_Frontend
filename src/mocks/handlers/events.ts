// このファイルは、MSW（Mock Service Worker）を使用して、イベント関連のAPIエンドポイントのモックハンドラーを定義するためのものです。
import { HttpResponse, http } from "msw";

// ダミーイベントデータを生成
const DUMMY_EVENTS = Array.from({ length: 100 }).map((_, index) => {
  const base = new Date(Date.UTC(2026, 5, 22 + index));
  const yyyy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(base.getUTCDate()).padStart(2, "0");
  const isMorning = index % 2 === 0;

  const postedDate = new Date(Date.UTC(2026, 5, 22 + index, 7 - 9, index * 5)); // JSTの7時はUTCだと-9時間
  const pYyyy = postedDate.getUTCFullYear();
  const pMm = String(postedDate.getUTCMonth() + 1).padStart(2, "0");
  const pDd = String(postedDate.getUTCDate()).padStart(2, "0");
  const pHh = String(postedDate.getUTCHours()).padStart(2, "0");
  const pMin = String(postedDate.getUTCMinutes()).padStart(2, "0");

  return {
    id: String(index + 1),
    title: `${index % 3 === 0 ? "🦆" : index % 3 === 1 ? "🐟" : "🦋"} 森と水の生き物観察ハイク Vol.${index + 1}`,
    dateLabel: isMorning ? "朝の部" : "午後の部",
    startAt: `${yyyy}-${mm}-${dd}T${isMorning ? "10:00:00" : "14:00:00"}+09:00`,
    location:
      index % 2 === 0
        ? "青葉の森公園 (ネイチャーセンター前)"
        : "月見湖ビオトープ (東口集合)",
    host: index % 2 === 0 ? "ナチュビト公式" : "森の案内人・山田",
    postedAt: `${pYyyy}-${pMm}-${pDd}T${pHh}:${pMin}:00+09:00`,
  };
});

// MSWのハンドラーを定義
export const eventHandlers = [
  http.get("/api/events", () => {
    return HttpResponse.json(DUMMY_EVENTS);
  }),
  // 新しいイベントを作成するモックエンドポイント
  http.post("/api/v1/events", async ({ request }) => {
    const authorizationHeader = request.headers.get("authorization");

    // 認証トークンが無効な場合は401エラーを返す
    if (!authorizationHeader?.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          error: {
            code: "unauthorized",
            message: "認証トークンが無効です",
          },
        },
        { status: 401 },
      );
    }

    // リクエストボディを取得して、新しいイベントのIDを付与して返す
    const body = (await request.json()) as Record<string, unknown>;

    // ここでは、実際のデータベース操作は行わず、リクエストボディに基づいて新しいイベントを作成したかのように応答する
    return HttpResponse.json(
      {
        id: "event-created-1",
        ...body,
      },
      { status: 201 },
    );
  }),
];
