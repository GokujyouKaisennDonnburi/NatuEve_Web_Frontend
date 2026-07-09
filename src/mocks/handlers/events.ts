// このファイルは、MSW（Mock Service Worker）を使用して、イベント関連のAPIエンドポイントのモックハンドラーを定義するためのものです。
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

// matchesAllKeywords は、event が keywords の全てを（AND 検索として）
// いずれかの検索対象フィールドに部分一致で含むかを判定する。
const matchesAllKeywords = (event: MockEvent, keywords: string[]): boolean => {
  if (keywords.length === 0) return true;
  const haystacks = collectSearchTargets(event).map((value) =>
    value.toLowerCase(),
  );
  return keywords.every((keyword) =>
    haystacks.some((value) => value.includes(keyword.toLowerCase())),
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
  const keywords = url.searchParams
    .getAll("q")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

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
            message: "認証トークンが無効です",
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

    return new HttpResponse(null, { status: 204 });
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
  // 同一イベントへの重複参加は 409 Conflict で返す。
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
    };

    // 本番のサーバー側バリデーションを模し、必須項目が欠ける場合は 400 を返す
    const hasMailAddress =
      typeof body.mailAddress === "string" && body.mailAddress.length > 0;
    const hasUsername =
      typeof body.username === "string" && body.username.length > 0;

    if (!hasMailAddress || !hasUsername) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "メールアドレスとユーザー名は必須です",
          },
        },
        { status: 400 },
      );
    }

    const mailAddress = body.mailAddress as string;
    const username = body.username as string;

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
            code: "conflict",
            message: "既に参加しています",
          },
        },
        { status: 409 },
      );
    }
    participants.add(participantKey);
    eventParticipants.set(id, participants);

    // 受領レスポンスを返す（本番 ParticipateEventResponse と同じ契約）
    return HttpResponse.json(
      {
        eventId: id,
        mailAddress,
        username,
        profileId,
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
];
