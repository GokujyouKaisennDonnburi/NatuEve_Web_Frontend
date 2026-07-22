// このファイルは、MSW ハンドラー間で共有するイベントの型・モックデータ・
// 検索ロジックを定義する。MSW はプロセス内状態のためリロードでリセットされる前提。

// MockProfile型は、イベントのプロフィール情報を表す型です。
export type MockProfile = {
  id: string;
  displayName: string;
  avatarUrl: string;
};

// MockEvent型は、イベントのデータ構造を表す型です。
export type MockEvent = {
  createdAt: string;
  eventDate: string;
  id: string;
  location: string;
  profile: MockProfile;
  profileId: string;
  title: string;
  tags?: Array<{ id: string; name: string }>;
  // イベントが取りやめになった日時(RFC3339)。未設定(undefined)の場合は開催予定。
  cancelledAt?: string | null;
};

// MockEventListResponse型は、イベントリストのレスポンスを表す型です。
export type MockEventListResponse = {
  events: MockEvent[];
  limit: number;
  offset: number;
  totalCount: number;
};

export type MockEventDetail = MockEvent & {
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
  tags?: Array<{ id: string; name: string }>;
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

// モック用の UUID を番号から生成する（PostgreSQL の UUID 型と互換）。
const toUuid = (n: number): string =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

// 開発環境でタグ表示の確認ができるようサンプルタグを用意。
// 一部のイベントはタグ未設定にしておき、未設定時の非表示挙動も検証可能にしている。
const SAMPLE_TAG_POOL: Array<Array<{ id: string; name: string }>> = [
  [
    { id: toUuid(1001), name: "自然観察" },
    { id: toUuid(1002), name: "ファミリー向け" },
  ],
  [
    { id: toUuid(1003), name: "生き物" },
    { id: toUuid(1004), name: "屋外" },
  ],
  [
    { id: toUuid(1005), name: "ハイキング" },
    { id: toUuid(1006), name: "初心者歓迎" },
  ],
  [
    { id: toUuid(1007), name: "野鳥" },
    { id: toUuid(1008), name: "双眼鏡推奨" },
  ],
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
      // イベント一覧取得の cancelledAt 絞り込み挙動を検証するため、
      // インデックス 0 と 50 のイベントをキャンセル済みとしてマークする。
      ...(index === 0 || index === 50
        ? { cancelledAt: new Date(Date.UTC(2026, 6, 1, 0, 0, 0)).toISOString() }
        : {}),
    };
  });
};

// メモリ内でイベント一覧を管理する（初期値はダミーイベント）
export const mockEvents: MockEvent[] = createInitialDummyEvents();

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

export const mockEventDetails = new Map<string, MockEventDetail>(
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
        if (typeof tag?.name === "string") {
          haystacks.push(tag.name);
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
export const getPagedEvents = (url: URL): MockEventListResponse => {
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

  // キャンセル済みイベント(cancelledAt が設定済み)は一覧から除外する。
  // バックエンド仕様: 公開イベント一覧は開催予定のみを返し totalCount も絞り込み後件数とする。
  const activeEvents = mockEvents.filter((event) => !event.cancelledAt);

  // 検索キーワードで絞り込む
  const filteredEvents = keywords.length
    ? activeEvents.filter((event) => matchesAllKeywords(event, keywords))
    : activeEvents;

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
