// このファイルは、MSW（Mock Service Worker）を使用して、イベント関連のAPIエンドポイントのモックハンドラーを定義するためのものです。
import { HttpResponse, http } from "msw";

// MockProfile型は、イベントのプロフィール情報を表す型です。
type MockProfile = {
  id: string;
  displayName: string;
  avatarUrl: string;
};

// MockEvent型は、イベントのデータ構造を表す型です。
type MockEvent = {
  createdAt: string;
  eventDate: string;
  id: string;
  location: string;
  profile: MockProfile;
  profileId: string;
  title: string;
};

// MockEventListResponse型は、イベントリストのレスポンスを表す型です。
type MockEventListResponse = {
  events: MockEvent[];
  limit: number;
  offset: number;
  totalCount: number;
};

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
  const profileId = `profile-${(index % 6) + 1}`;

  return {
    id: String(index + 1),
    title: `${index % 3 === 0 ? "🦆" : index % 3 === 1 ? "🐟" : "🦋"} 森と水の生き物観察ハイク Vol.${index + 1}`,
    eventDate: `${yyyy}-${mm}-${dd}T${isMorning ? "10:00:00" : "14:00:00"}+09:00`,
    location:
      index % 2 === 0
        ? "青葉の森公園 (ネイチャーセンター前)"
        : "月見湖ビオトープ (東口集合)",
    profileId,
    profile: {
      id: profileId,
      displayName: index % 2 === 0 ? "ナチュビト公式" : "森の案内人・山田",
      avatarUrl:
        index % 2 === 0
          ? "https://i.pravatar.cc/150?img=1"
          : "https://i.pravatar.cc/150?img=2",
    },
    createdAt: `${pYyyy}-${pMm}-${pDd}T${pHh}:${pMin}:00+09:00`,
  };
});

// getPagedEvents関数は、指定されたURLのクエリパラメータに基づいて、ダミーイベントデータをページングして返す関数です。
const getPagedEvents = (url: URL): MockEventListResponse => {
  // クエリパラメータからlimit, offset, sort, orderを取得し、適切な値に正規化する
  const limit = Math.max(
    1,
    Math.min(100, Number(url.searchParams.get("limit") ?? "15") || 15),
  );
  const offset = Math.max(
    0,
    Number(url.searchParams.get("offset") ?? "0") || 0,
  );
  const sort =
    url.searchParams.get("sort") === "event_date" ? "event_date" : "created_at";
  const order = url.searchParams.get("order") === "asc" ? "asc" : "desc";

  // ダミーイベントデータをソートする
  const sortedEvents = [...DUMMY_EVENTS].sort((left, right) => {
    const leftValue = sort === "event_date" ? left.eventDate : left.createdAt;
    const rightValue =
      sort === "event_date" ? right.eventDate : right.createdAt;
    return leftValue.localeCompare(rightValue);
  });

  const normalizedEvents =
    order === "asc" ? sortedEvents : sortedEvents.reverse();
  const events = normalizedEvents.slice(offset, offset + limit);

  return {
    events,
    limit,
    offset,
    totalCount: DUMMY_EVENTS.length,
  };
};

// MSWのハンドラーを定義
export const eventHandlers = [
  http.get("/api/v1/events", ({ request }) => {
    return HttpResponse.json(getPagedEvents(new URL(request.url)));
  }),
  http.get("/api/events", ({ request }) => {
    return HttpResponse.json(getPagedEvents(new URL(request.url)));
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

    // リクエストボディを取得する。本番 CreateEventRequest と同じ契約を想定する。
    const body = (await request.json()) as {
      title?: unknown;
      costs?: unknown;
    };

    // 本番のサーバー側バリデーションを模し、必須項目（title / costs）が欠ける
    // 不正なボディは 400 を返す。これによりフロントの payload 変換漏れを検知できる。
    const hasTitle = typeof body.title === "string" && body.title.length > 0;
    const hasCosts = Array.isArray(body.costs) && body.costs.length > 0;
    if (!hasTitle || !hasCosts) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "リクエストボディが不正です",
          },
        },
        { status: 400 },
      );
    }

    // 実際の DB 操作は行わず、本番と同形の CreateEventResponse（id / createdAt）を返す。
    return HttpResponse.json(
      {
        id: "event-created-1",
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
];
