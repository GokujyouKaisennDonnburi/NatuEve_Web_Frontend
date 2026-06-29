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

// ダミーイベントデータの初期値を生成
const createInitialDummyEvents = (): MockEvent[] => {
  return Array.from({ length: 100 }).map((_, index) => {
    const base = new Date(Date.UTC(2026, 5, 22 + index));
    const yyyy = base.getUTCFullYear();
    const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(base.getUTCDate()).padStart(2, "0");
    const isMorning = index % 2 === 0;

    const postedDate = new Date(Date.UTC(2026, 1, 1 + index, 7 - 9, index * 5)); // JSTの7時はUTCだと-9時間
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
};

// メモリ内でイベント一覧を管理する（初期値はダミーイベント）
const mockEvents: MockEvent[] = createInitialDummyEvents();

// getPagedEvents関数は、指定されたURLのクエリパラメータに基づいて、イベントデータをページングして返す関数です。
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

  // イベントデータをソートする
  const sortedEvents = [...mockEvents].sort((left, right) => {
    const leftValue = sort === "event_date" ? left.eventDate : left.createdAt;
    const rightValue =
      sort === "event_date" ? right.eventDate : right.createdAt;
    const leftTime = Date.parse(leftValue);
    const rightTime = Date.parse(rightValue);

    // 両方の値が有効な日付の場合は、日付の差を返す
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
      return leftTime - rightTime;
    }

    // パースできない場合は文字列比較にフォールバック
    return leftValue.localeCompare(rightValue);
  });

  // ソート順に応じてイベントデータを正規化し、指定された範囲のイベントを取得する
  const normalizedEvents =
    order === "asc" ? sortedEvents : sortedEvents.reverse();
  const events = normalizedEvents.slice(offset, offset + limit);

  return {
    events,
    limit,
    offset,
    totalCount: mockEvents.length,
  };
};

// MSWのハンドラーを定義
export const eventHandlers = [
  // イベント一覧取得モックエンドポイント
  http.get("/api/v1/events", ({ request }) => {
    return HttpResponse.json(getPagedEvents(new URL(request.url)));
  }),

  // イベント詳細取得（id）
  http.get("/api/events/:id", ({ params }) => {
    const id = String(params?.id ?? "");
    const found = createInitialDummyEvents().find((e) => e.id === id);
    if (!found) {
      return HttpResponse.json(
        { error: { code: "not_found", message: "イベントが見つかりません" } },
        { status: 404 },
      );
    }

    // 詳細フィールドを付与して返す（投稿時のフォーマットを模倣）
    const detail = {
      id: found.id,
      organizerName: found.host,
      organizerAvatarUrl: undefined,
      title: found.title,
      description: `詳細情報です。自然観察を楽しみましょう。`,
      location: found.location,
      eventDate: found.startAt,
      capacity: 30,
      externalUrl: "https://example.com/event",
      costs: [
        { category: "大人", cost: 1000 },
        { category: "子ども", cost: 500 },
      ],
      items: [
        { item: "飲み物", isRequired: true },
        { item: "帽子", isRequired: false },
      ],
      imageObjectKeys: [
        // 外部プレースホルダ画像を使う（実ファイルがなくても表示される）
        "https://picsum.photos/1200/600?random=1",
        "https://picsum.photos/1200/600?random=2",
        "https://picsum.photos/1200/600?random=3",
      ],
      pdfObjectKeys: [
        // 外部PDFを指すURL（クリックでダウンロード）
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      ],
    };

    return HttpResponse.json(detail);
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
      description?: unknown;
      location?: unknown;
      eventDate?: unknown;
      costs?: unknown;
    };

    // 本番のサーバー側バリデーションを模し、必須項目が欠ける場合は 400 を返す。
    const hasTitle = typeof body.title === "string" && body.title.length > 0;
    const hasDescription =
      typeof body.description === "string" && body.description.length > 0;
    const hasLocation =
      typeof body.location === "string" && body.location.length > 0;
    const hasEventDate = typeof body.eventDate === "string";
    const hasCosts = Array.isArray(body.costs) && body.costs.length > 0;

    // 必須項目が欠けている場合は400エラーを返す
    if (
      !hasTitle ||
      !hasDescription ||
      !hasLocation ||
      !hasEventDate ||
      !hasCosts
    ) {
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

    // 新しいイベントを構築してメモリに追加する
    const eventId = String(
      Math.max(...mockEvents.map((e) => Number(e.id))) + 1,
    );
    const newEvent: MockEvent = {
      id: eventId,
      title: body.title as string,
      location: body.location as string,
      eventDate: body.eventDate as string,
      profileId: "mock-user-1",
      profile: {
        id: "mock-user-1",
        displayName: "Aoi Tanaka",
        avatarUrl: "https://i.pravatar.cc/150?img=1",
      },
      createdAt: new Date().toISOString(),
    };

    mockEvents.push(newEvent);

    // 本番と同形の CreateEventResponse（id / createdAt）を返す。
    return HttpResponse.json(
      {
        id: eventId,
        createdAt: newEvent.createdAt,
      },
      { status: 201 },
    );
  }),
];
