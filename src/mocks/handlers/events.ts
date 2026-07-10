// このファイルは、MSW（Mock Service Worker）を使用して、イベント関連のAPIエンドポイントのモックハンドラーを定義するためのものです。
import { MOCK_AUTH_SESSION } from "@/services/mockAuth";
import { HttpResponse, http } from "msw";

import { MAX_TAG_COUNT, MAX_TAG_LENGTH } from "@/constants/config";

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
  tags?: string[];
};

// MockEventListResponse型は、イベントリストのレスポンスを表す型です。
type MockEventListResponse = {
  events: MockEvent[];
  limit: number;
  offset: number;
  totalCount: number;
};

type MockEventDetail = MockEvent & {
  organizerName: string;
  organizerAvatarUrl: string;
  description: string;
  capacity?: number;
  externalUrl?: string;
  costs: { category: string; cost: number }[];
  items?: { item: string; isRequired: boolean }[];
  imageUrls?: string[];
  imageObjectKeys?: string[];
  imageFilenames?: string[];
  pdfUrls?: string[];
  pdfObjectKeys?: string[];
  pdfFilenames?: string[];
  tags?: string[];
  reports?: {
    id: string;
    createdAt: string;
    authorName: string;
    authorAvatarUrl: string;
    content?: string;
    externalUrl?: string;
    imageUrls?: string[];
    pdfUrls?: string[];
  }[];
};

// 開発環境でタグ表示の確認ができるようサンプルタグを用意。
// 一部のイベントはタグ未設定にしておき、未設定時の非表示挙動も検証可能にしている。
const SAMPLE_TAG_POOL: string[][] = [
  ["自然観察", "ファミリー向け"],
  ["生き物", "屋外"],
  ["ハイキング", "初心者歓迎"],
  ["野鳥", "双眼鏡推奨"],
];
// モック用の UUID を番号から生成する（PostgreSQL の UUID 型と互換）。
const toUuid = (n: number): string =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

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
      id: toUuid(index + 1),
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
      ...(index % 5 === 0
        ? {}
        : { tags: SAMPLE_TAG_POOL[index % SAMPLE_TAG_POOL.length] }),
    };
  });
};

// メモリ内でイベント一覧を管理する（初期値はダミーイベント）
const mockEvents: MockEvent[] = createInitialDummyEvents();

const createDefaultMockEventDetail = (
  event: MockEvent,
  index: number,
): MockEventDetail => ({
  ...event,
  organizerName: event.profile.displayName,
  organizerAvatarUrl: event.profile.avatarUrl,
  description: `詳細情報です。自然観察を楽しみましょう。`,
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
  // tags フィールドは index % 5 === 0 のとき JSON に含めない(undefined として返却)。
  // EventTagList のオプショナル props フォールバック動作を end-to-end で検証できるようにしている。
  ...(index % 5 === 0
    ? {}
    : { tags: SAMPLE_TAG_POOL[index % SAMPLE_TAG_POOL.length] }),
  imageObjectKeys: [
    `https://picsum.photos/1200/600?random=${index * 3 + 1}`,
    `https://picsum.photos/1200/600?random=${index * 3 + 2}`,
    `https://picsum.photos/1200/600?random=${index * 3 + 3}`,
  ],
  imageUrls: [
    `https://picsum.photos/1200/600?random=${index * 3 + 1}`,
    `https://picsum.photos/1200/600?random=${index * 3 + 2}`,
    `https://picsum.photos/1200/600?random=${index * 3 + 3}`,
  ],
  imageFilenames: ["観察風景1.jpg", "観察風景2.jpg", "観察風景3.jpg"],
  pdfObjectKeys: [
    "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  ],
  pdfUrls: [
    "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  ],
  pdfFilenames: ["サンプル資料.pdf"],
  reports: [
    {
      id: `report-${event.id}-1`,
      createdAt: new Date(Date.UTC(2026, 5, 18 + index, 10, 30)).toISOString(),
      authorName: event.profile.displayName,
      authorAvatarUrl: event.profile.avatarUrl,
      content:
        "本日の観察記録です。参加者同士で花や昆虫の名前を確認し、自然の大切さを話し合いました。",
      externalUrl:
        index % 2 === 0 ? `https://example.com/reports/${event.id}` : undefined,
      imageUrls: [
        `https://picsum.photos/600/400?random=${index * 5 + 1}`,
        `https://picsum.photos/600/400?random=${index * 5 + 2}`,
      ],
      pdfUrls: [
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      ],
    },
  ],
});

const mockEventDetails = new Map<string, MockEventDetail>(
  mockEvents.map((event, index) => [
    event.id,
    createDefaultMockEventDetail(event, index),
  ]),
);

// 検索対象フィールドを収集する。
// 検索対象: title / location / profile.displayName(主催者) /
//           description / organizerName(主催者) / items(イベントアイテム)
// 一覧 API が返す MockEvent には description / items / organizerName が無いため、
// 詳細モック（mockEventDetails）を参照して検索対象を拡張する。
const collectSearchTargets = (event: MockEvent): string[] => {
  const haystacks: string[] = [
    event.title,
    event.location,
    event.profile.displayName,
  ];
  const detail = mockEventDetails.get(event.id);
  if (detail) {
    if (typeof detail.description === "string") {
      haystacks.push(detail.description);
    }
    if (typeof detail.organizerName === "string") {
      haystacks.push(detail.organizerName);
    }
    if (Array.isArray(detail.items)) {
      for (const entry of detail.items) {
        if (typeof entry?.item === "string") {
          haystacks.push(entry.item);
        }
      }
    }
    if (Array.isArray(detail.tags)) {
      for (const tag of detail.tags) {
        if (typeof tag === "string") {
          haystacks.push(tag);
        }
      }
    }
  }
  return haystacks;
};

// 検索時の文字列正規化。
// swagger 仕様に基づき NFKC 正規化で半角/全角を同一視し、
// さらに大文字小文字も無視する（toLowerCase）。
// 例: "１０" ↔ "10", "ＡＢ" ↔ "AB", "ｶﾅ" ↔ "カナ"
const normalizeForKeywordSearch = (value: string): string =>
  value.normalize("NFKC").toLowerCase();

// matchesAllKeywords は、event が keywords の全てを（AND 検索として）
// いずれかの検索対象フィールドに部分一致で含むかを判定する。
// 照合は NFKC 正規化＋大文字小文字無視で行う。
const matchesAllKeywords = (event: MockEvent, keywords: string[]): boolean => {
  if (keywords.length === 0) return true;
  const haystacks = collectSearchTargets(event).map((value) =>
    normalizeForKeywordSearch(value),
  );
  // キーワードは最大10語なので先に一度だけ正規化してから照合する
  const normalizedKeywords = keywords.map((keyword) =>
    normalizeForKeywordSearch(keyword),
  );
  return normalizedKeywords.every((keyword) =>
    haystacks.some((value) => value.includes(keyword)),
  );
};

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

  // 同名の q パラメータが複数ある場合は getAll で配列として取り出し、
  // 1件の場合も同じ配列相当の形で扱う。空キーワードは除外する。
  // swagger 仕様に基づき最大10語までとし、超過分は切り捨てる。
  const keywords = url.searchParams
    .getAll("q")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .slice(0, 10);

  // 検索キーワードで絞り込む
  const filteredEvents = keywords.length
    ? mockEvents.filter((event) => matchesAllKeywords(event, keywords))
    : mockEvents;

  // イベントデータをソートする
  const sortedEvents = [...filteredEvents].sort((left, right) => {
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
    totalCount: filteredEvents.length,
  };
};

// メモリ内参加者管理：eventId ごとに参加者キー（profileId or mailAddress）を保持
// 重複参加チェック（409 Conflict）のために使用
const eventParticipants = new Map<string, Set<string>>();

// 参加者一覧取得 API（GET /api/v1/events/{id}/members）が返す参加者1件分の型。
// 匿名参加時は profileId が null となる。swagger（GET .../members）の
// レスポンス定義に合わせ、id / eventId は含めない（兄弟エンドポイントと統一）。
type MockEventMember = {
  username: string;
  mailAddress: string;
  partySize: number;
  profileId: string | null;
  createdAt: string;
};

// メモリ内参加者一覧管理：eventId ごとに参加者レコード配列を保持する。
// members エンドポイントはこの配列を元に参加者一覧 / 参加組数 / 合計参加人数を算出する。
const eventMembers = new Map<string, MockEventMember[]>();

// モック環境での「Bearer トークン → profileId」対応表。
// 本番ではトークン検証でユーザーID（profileId）が決まるが、モックでは
// トークン文字列をそのまま profileId として扱うと、主催者の profileId を直接
// Bearer に仕込むだけで主催者チェックを通過できてしまう認可バグの温床になる。
// そのため既知トークンのみを受け付け、未知トークンは 401 で弾く。
const TOKEN_TO_PROFILE_ID: Readonly<Record<string, string>> = {
  [MOCK_AUTH_SESSION.token]: MOCK_AUTH_SESSION.userId,
};

// 新規作成イベントに参加者モックデータをシードする。
// 主催者画面の動作確認用で、ログイン参加・匿名参加（profileId: null）を混在させることで
// 参加組数 / 合計参加人数 / 匿名表示の検証を網羅できるようにしている。
const seedMembersForNewEvent = (eventId: string): void => {
  const base = Date.now() - 1000 * 60 * 60 * 24 * 3;
  const members: MockEventMember[] = [
    {
      username: "Ren Sato",
      mailAddress: "ren@example.com",
      partySize: 2,
      profileId: "profile-2",
      createdAt: new Date(base).toISOString(),
    },
    {
      username: "Mina Suzuki",
      mailAddress: "mina@example.com",
      partySize: 1,
      profileId: "profile-3",
      createdAt: new Date(base + 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      username: "ゲストさん",
      mailAddress: "guest@example.com",
      partySize: 3,
      profileId: null,
      createdAt: new Date(base + 1000 * 60 * 60 * 24).toISOString(),
    },
  ];
  eventMembers.set(eventId, members);
};
// 削除済みイベントIDの記録: 「削除 → 通知」フローで削除後に通知 API を叩けるようにするため、
// 削除後も通知エンドポイントが 404 にならないよう直近の削除 ID を保持する。
const deletedEventIds = new Set<string>();

// MSWのハンドラーを定義
export const eventHandlers = [
  // イベント一覧取得モックエンドポイント
  http.get("/api/v1/events", ({ request }) => {
    return HttpResponse.json(getPagedEvents(new URL(request.url)));
  }),

  // イベント詳細取得（id）
  http.get("/api/v1/events/:id", ({ params }) => {
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
  }),

  // イベントに対するレポート取得（認証不要・1イベント1レポート）
  // レポート未投稿時は 404 を返す。
  http.get("/api/v1/events/:id/report", ({ params }) => {
    const id = String(params?.id ?? "");
    const found = mockEventDetails.get(id);
    const report = found?.reports?.[0];
    if (!found || !report) {
      return HttpResponse.json(
        {
          error: {
            code: "not_found",
            message: "レポートが見つかりません",
          },
        },
        { status: 404 },
      );
    }

    // GET /api/v1/events/{id}/report のレスポンス形式に合わせて返す
    return HttpResponse.json({
      id: report.id,
      eventId: id,
      content: report.content,
      externalUrls:
        typeof report.externalUrl === "string" && report.externalUrl.length > 0
          ? [report.externalUrl]
          : [],
      imageObjectKeys: [],
      imageFilenames: [],
      imageUrls: report.imageUrls ?? [],
      pdfObjectKeys: [],
      pdfFilenames: [],
      pdfUrls: report.pdfUrls ?? [],
      createdAt: report.createdAt,
      updatedAt: report.createdAt,
    });
  }),

  // イベント削除モックエンドポイント（DELETE /api/v1/events/:id）
  http.delete("/api/v1/events/:id", async ({ request, params }) => {
    const id = String(params?.id ?? "");
    const authorizationHeader = request.headers.get("authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          error: {
            code: "unauthorized",
            message: "認証が必要です",
          },
        },
        { status: 401 },
      );
    }

    const eventIndex = mockEvents.findIndex((event) => event.id === id);
    if (eventIndex === -1) {
      return HttpResponse.json(
        {
          error: {
            code: "not_found",
            message: "イベントが見つかりません",
          },
        },
        { status: 404 },
      );
    }

    mockEvents.splice(eventIndex, 1);
    mockEventDetails.delete(id);
    eventParticipants.delete(id);
    eventMembers.delete(id);
    deletedEventIds.add(id);

    return new HttpResponse(null, { status: 204 });
  }),

  // イベント参加者への一斉通知モックエンドポイント（POST /api/v1/events/:id/notifications）
  http.post("/api/v1/events/:id/notifications", async ({ request, params }) => {
    const id = String(params?.id ?? "");
    const authorizationHeader = request.headers.get("authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          error: {
            code: "unauthorized",
            message: "認証が必要です",
          },
        },
        { status: 401 },
      );
    }

    if (!mockEventDetails.has(id) && !deletedEventIds.has(id)) {
      return HttpResponse.json(
        {
          error: {
            code: "not_found",
            message: "イベントが見つかりません",
          },
        },
        { status: 404 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      subject?: unknown;
      body?: unknown;
    };

    if (typeof body.subject !== "string" || body.subject.length === 0) {
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

    return HttpResponse.json({
      eventId: id,
      recipientCount: 0,
      sentCount: 0,
      notifiedCount: 0,
      failedCount: 0,
    });
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
            message: "認証が必要です",
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
      capacity?: unknown;
      externalUrl?: unknown;
      items?: unknown;
      tags?: unknown;
      imageObjectKeys?: unknown;
      imageUrls?: unknown;
      imageFilenames?: unknown;
      pdfObjectKeys?: unknown;
      pdfUrls?: unknown;
      pdfFilenames?: unknown;
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

    // タグのサーバー側バリデーション(任意項目)。本番仕様に合わせて
    // 配列・文字列・空文字・文字数・件数・重複をここで検証する。
    let normalizedTags: string[] | undefined;
    if (body.tags !== undefined && body.tags !== null) {
      if (!Array.isArray(body.tags)) {
        return HttpResponse.json(
          {
            error: {
              code: "invalid_request",
              message: "タグの形式が不正です",
            },
          },
          { status: 400 },
        );
      }

      const candidateTags: string[] = [];
      for (const value of body.tags) {
        if (typeof value !== "string") {
          return HttpResponse.json(
            {
              error: {
                code: "invalid_request",
                message: "タグは文字列で指定してください",
              },
            },
            { status: 400 },
          );
        }
        const trimmed = value.trim();
        if (trimmed.length === 0) {
          return HttpResponse.json(
            {
              error: {
                code: "invalid_request",
                message: "タグに空文字は指定できません。",
              },
            },
            { status: 400 },
          );
        }
        if (trimmed.length > MAX_TAG_LENGTH) {
          return HttpResponse.json(
            {
              error: {
                code: "invalid_request",
                message: `タグは1つあたり${MAX_TAG_LENGTH}文字以内で指定してください`,
              },
            },
            { status: 400 },
          );
        }
        candidateTags.push(trimmed);
      }

      if (candidateTags.length > MAX_TAG_COUNT) {
        return HttpResponse.json(
          {
            error: {
              code: "invalid_request",
              message: `タグは最大${MAX_TAG_COUNT}件までです`,
            },
          },
          { status: 400 },
        );
      }

      const tagSet = new Set<string>();
      for (const tag of candidateTags) {
        if (tagSet.has(tag)) {
          return HttpResponse.json(
            {
              error: {
                code: "invalid_request",
                message: "同じタグが重複しています",
              },
            },
            { status: 400 },
          );
        }
        tagSet.add(tag);
      }

      normalizedTags = candidateTags.length > 0 ? candidateTags : undefined;
    }

    // 新しいイベントを構築してメモリに追加する
    const eventId = crypto.randomUUID();
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
    mockEventDetails.set(eventId, {
      ...newEvent,
      organizerName: newEvent.profile.displayName,
      organizerAvatarUrl: newEvent.profile.avatarUrl,
      description: body.description as string,
      capacity: typeof body.capacity === "number" ? body.capacity : undefined,
      externalUrl:
        typeof body.externalUrl === "string" && body.externalUrl.length > 0
          ? body.externalUrl
          : undefined,
      costs: Array.isArray(body.costs)
        ? body.costs.map((cost) => {
            const item = cost as {
              category?: unknown;
              cost?: unknown;
            };

            return {
              category: typeof item.category === "string" ? item.category : "",
              cost: typeof item.cost === "number" ? item.cost : 0,
            };
          })
        : [],
      items: Array.isArray(body.items)
        ? body.items.map((item) => {
            const entry = item as {
              item?: unknown;
              isRequired?: unknown;
            };

            return {
              item: typeof entry.item === "string" ? entry.item : "",
              isRequired: entry.isRequired === true,
            };
          })
        : undefined,
      imageObjectKeys: Array.isArray(body.imageObjectKeys)
        ? body.imageObjectKeys.filter(
            (value): value is string => typeof value === "string",
          )
        : undefined,
      imageUrls: Array.isArray(body.imageUrls)
        ? (body.imageUrls as unknown[]).filter(
            (value): value is string => typeof value === "string",
          )
        : undefined,
      imageFilenames: Array.isArray(body.imageFilenames)
        ? body.imageFilenames.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      pdfObjectKeys: Array.isArray(body.pdfObjectKeys)
        ? body.pdfObjectKeys.filter(
            (value): value is string => typeof value === "string",
          )
        : undefined,
      pdfUrls: Array.isArray(body.pdfUrls)
        ? (body.pdfUrls as unknown[]).filter(
            (value): value is string => typeof value === "string",
          )
        : undefined,
      pdfFilenames: Array.isArray(body.pdfFilenames)
        ? body.pdfFilenames.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      tags: normalizedTags,
    });

    // 主催者画面（参加者一覧）の動作確認用に、新規イベントに参加者モックをシードする。
    seedMembersForNewEvent(eventId);

    // 本番と同形の CreateEventResponse（id / createdAt）を返す。
    return HttpResponse.json(
      {
        id: eventId,
        createdAt: newEvent.createdAt,
      },
      { status: 201 },
    );
  }),

  // イベント参加モックエンドポイント（POST /api/v1/events/:id/join）
  // 認証は任意。Authorization ヘッダなし → 匿名参加（profileId = null）。
  // ヘッダありで有効な Bearer → profileId を記録してログイン参加。
  // 同一イベントへの重複参加は 409 already_joined、定員超過は 409 capacity_full で返す。
  // メモリ内参加者管理はモジュールスコープの eventParticipants を使用
  http.post("/api/v1/events/:id/join", async ({ request, params }) => {
    const id = String(params?.id ?? "");

    // イベントが存在しない場合は404エラーを返す
    if (!mockEventDetails.has(id)) {
      return HttpResponse.json(
        {
          error: {
            code: "not_found",
            message: "イベントが見つかりません",
          },
        },
        { status: 404 },
      );
    }

    // リクエストボディを取得する（本番 ParticipateEventRequest と同じ契約）
    const body = (await request.json()) as {
      mailAddress?: unknown;
      username?: unknown;
      partySize?: unknown;
    };

    // 本番のサーバー側バリデーションを模し、必須項目が欠ける場合は 400 を返す
    const hasMailAddress =
      typeof body.mailAddress === "string" && body.mailAddress.length > 0;
    const hasUsername =
      typeof body.username === "string" && body.username.length > 0;
    const hasValidPartySize =
      typeof body.partySize === "number" &&
      Number.isInteger(body.partySize) &&
      body.partySize >= 1;

    // 必須項目が欠けている場合は400エラーを返す
    if (!hasMailAddress || !hasUsername || !hasValidPartySize) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message:
              "メールアドレス・ユーザー名・参加人数（1以上の整数）は必須です",
          },
        },
        { status: 400 },
      );
    }

    const mailAddress = body.mailAddress as string;
    const username = body.username as string;
    const partySize = body.partySize as number;

    // 定員チェック：イベントの定員が設定されている場合は、
    // 参加人数が定員を超える場合は 409 capacity_full を返す
    const detail = mockEventDetails.get(id);
    if (
      typeof detail?.capacity === "number" &&
      detail.capacity >= 1 &&
      partySize > detail.capacity
    ) {
      return HttpResponse.json(
        {
          error: {
            code: "capacity_full",
            message: "定員に達しています",
          },
        },
        { status: 409 },
      );
    }

    // 認証ヘッダの有無で profileId を決定
    // ヘッダなし → 匿名参加（profileId = null）
    // ヘッダあり（Bearer） → トークンを profileId として流用（モック限定ハック）
    const authorizationHeader = request.headers.get("authorization");
    const hasBearer = Boolean(authorizationHeader?.startsWith("Bearer "));
    const profileId = hasBearer
      ? (authorizationHeader?.split(" ")[1]?.trim() ?? null)
      : null;

    // 重複参加チェック：ログイン時は profileId、匿名時は mailAddress で識別
    const participantKey = profileId ?? `anon:${mailAddress}`;
    const participants = eventParticipants.get(id) ?? new Set<string>();
    if (participants.has(participantKey)) {
      return HttpResponse.json(
        {
          error: {
            code: "already_joined",
            message: "既に参加しています",
          },
        },
        { status: 409 },
      );
    }
    participants.add(participantKey);
    eventParticipants.set(id, participants);

    // 申込日時を1回だけ生成し、参加者一覧と受領レスポンスの両方に使い回す。
    // id が廃止され createdAt が識別・表示の重要情報になったため、同一申込で
    // タイムスタンプがズレないよう単一の値で整合性を保つ。
    const createdAt = new Date().toISOString();

    // members エンドポイントで参加者一覧に反映されるよう、参加レコードを蓄積する。
    const members = eventMembers.get(id) ?? [];
    members.push({
      username,
      mailAddress,
      partySize,
      profileId,
      createdAt,
    });
    eventMembers.set(id, members);

    // 受領レスポンスを返す（本番 ParticipateEventResponse と同じ契約）
    return HttpResponse.json(
      {
        eventId: id,
        mailAddress,
        username,
        partySize,
        profileId,
        createdAt,
      },
      { status: 201 },
    );
  }),

  // イベント参加者一覧取得モックエンドポイント（GET /api/v1/events/:id/members）
  // 主催者のみ閲覧可能。主催者以外は 403、未認証・未知トークンは 401 を返す。
  // トークン→profileId は TOKEN_TO_PROFILE_ID で明示的に対応付け、
  // 未知トークンをそのまま profileId として扱う認可バイパスを防ぐ。
  // swagger に合わせ、イベント不存在は 400 invalid_request（兄弟エンドポイントと統一）。
  http.get("/api/v1/events/:id/members", ({ request, params }) => {
    const id = String(params?.id ?? "");
    const authorizationHeader = request.headers.get("authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          error: {
            code: "unauthorized",
            message: "認証が必要です",
          },
        },
        { status: 401 },
      );
    }

    const token = authorizationHeader.split(" ")[1]?.trim() ?? "";
    const requesterProfileId = TOKEN_TO_PROFILE_ID[token];
    if (!requesterProfileId) {
      return HttpResponse.json(
        {
          error: {
            code: "unauthorized",
            message: "認証が必要です",
          },
        },
        { status: 401 },
      );
    }

    const event = mockEventDetails.get(id);
    if (!event) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "リクエストが不正です",
          },
        },
        { status: 400 },
      );
    }

    if (event.profileId !== requesterProfileId) {
      return HttpResponse.json(
        {
          error: {
            code: "forbidden",
            message: "主催者のみ閲覧できます",
          },
        },
        { status: 403 },
      );
    }

    const members = eventMembers.get(id) ?? [];
    const totalCount = members.length;
    const totalMembers = members.reduce(
      (sum, member) =>
        sum + (Number.isFinite(member.partySize) ? member.partySize : 0),
      0,
    );

    return HttpResponse.json({ members, totalCount, totalMembers });
  }),

  // イベント参加状態取得モックエンドポイント（GET /api/v1/events/:id/participation-logs）
  // 現在のログインユーザーが当該イベントに参加中かどうかを返す。要認証。
  // 未認証・未知トークンは 401、イベント不存在は 400 invalid_request（兄弟エンドポイントと統一）。
  // 参加判定は eventParticipants に登録されたキー（ログイン時はトークンを profileId として扱う）で行う。
  http.get("/api/v1/events/:id/participation-logs", ({ request, params }) => {
    const id = String(params?.id ?? "");
    const authorizationHeader = request.headers.get("authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          error: {
            code: "unauthorized",
            message: "認証が必要です",
          },
        },
        { status: 401 },
      );
    }

    // トークン→profileId の対応付け検証のみ（unknown トークンを弾く）。
    // 参加判定には eventParticipants のキー（raw token）をそのまま使用する。
    // これは join エンドポイントが raw token を participantKey として登録する挙動と一致させるため。
    const token = authorizationHeader.split(" ")[1]?.trim() ?? "";
    const requesterProfileId = TOKEN_TO_PROFILE_ID[token];
    if (!requesterProfileId) {
      return HttpResponse.json(
        {
          error: {
            code: "unauthorized",
            message: "認証が必要です",
          },
        },
        { status: 401 },
      );
    }

    // イベント不存在は swagger 指定により 400 invalid_request（兄弟エンドポイントと統一）。
    if (!mockEventDetails.has(id)) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "リクエストが不正です",
          },
        },
        { status: 400 },
      );
    }

    // eventParticipants のキーは join エンドポイントが raw token で登録するため、
    // ここでも raw token で判定する。
    const participants = eventParticipants.get(id);
    const participating = participants?.has(token) ?? false;

    return HttpResponse.json({ participating });
  }),

  // イベント参加キャンセルモックエンドポイント（POST /api/v1/events/:id/joined-cancel）
  // 参加済みユーザーが参加をキャンセルする。要認証。リクエストボディは不要。
  // 未認証・未知トークンは 401、イベント不存在は 400 invalid_request、未参加は 409 not_joined。
  http.post("/api/v1/events/:id/joined-cancel", ({ request, params }) => {
    const id = String(params?.id ?? "");
    const authorizationHeader = request.headers.get("authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          error: {
            code: "unauthorized",
            message: "認証が必要です",
          },
        },
        { status: 401 },
      );
    }

    const token = authorizationHeader.split(" ")[1]?.trim() ?? "";
    const requesterProfileId = TOKEN_TO_PROFILE_ID[token];
    if (!requesterProfileId) {
      return HttpResponse.json(
        {
          error: {
            code: "unauthorized",
            message: "認証が必要です",
          },
        },
        { status: 401 },
      );
    }

    // イベント不存在は swagger 指定により 400 invalid_request（兄弟エンドポイントと統一）。
    if (!mockEventDetails.has(id)) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "リクエストが不正です",
          },
        },
        { status: 400 },
      );
    }

    // 未参加チェック：eventParticipants にトークンが登録されていなければ 409 not_joined。
    const participants = eventParticipants.get(id);
    const participantKey = token;
    if (!participants?.has(participantKey)) {
      return HttpResponse.json(
        {
          error: {
            code: "not_joined",
            message: "このイベントに参加していません",
          },
        },
        { status: 409 },
      );
    }

    // 参加記録を削除してキャンセル完了
    participants.delete(participantKey);
    eventParticipants.set(id, participants);

    // eventMembers からも該当レコードを削除する。
    // ログイン参加の場合は profileId（= TOKEN_TO_PROFILE_ID[token]）で特定する。
    const members = eventMembers.get(id);
    if (members) {
      const updatedMembers = members.filter(
        (member) => member.profileId !== requesterProfileId,
      );
      eventMembers.set(id, updatedMembers);
    }

    return HttpResponse.json(
      {
        profileId: requesterProfileId,
        eventId: id,
        createdAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),
];
