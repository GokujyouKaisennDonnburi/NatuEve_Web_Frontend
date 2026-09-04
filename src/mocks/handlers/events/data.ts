// このファイルは、MSW ハンドラー間で共有するイベントの型・モックデータ・
// 検索ロジックを定義する。MSW はプロセス内状態のためリロードでリセットされる前提。
import { seedEventMembers, seedMyParticipation } from "./participation";

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
  // 終了日時(RFC3339)。作成時に省略された場合は eventDate と同値が入る。
  endDate: string;
  id: string;
  location: string;
  profile: MockProfile;
  profileId: string;
  title: string;
  tags?: Array<{ id: string; name: string }>;
  // 申込期限(RFC3339)。未設定(undefined)の場合は締切なし。
  applicationDeadline?: string | null;
  // イベントが取りやめになった日時(RFC3339)。未設定(undefined)の場合は開催予定。
  cancelledAt?: string | null;
};

// MockEventListResponse型は、イベントリストのレスポンスを表す型です。
export type MockEventListResponse = {
  events: MockEvent[];
  limit: number;
  offset: number;
  totalCount: number;
  error?: {
    code: string;
    message: string;
  };
};

// UUIDの簡易検証（桁数とハイフン位置のみ）。
const isValidUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export type MockEventDetail = MockEvent & {
  organizerName: string;
  organizerAvatarUrl: string;
  description: string;
  capacity?: number;
  // 参加の取り消し期限(RFC3339)。未設定(undefined)の場合は期限なしとして扱う。
  cancelDeadline?: string | null;
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

// モックデータの location に付与する都道府県＋市区町村のプレフィックス。
// イベント作成時の保存形式（都道府県＋市区町村＋施設名）に合わせて、
// location パラメータによる地域絞り込みを検証できるようにしている。
const SAMPLE_LOCATION_POOL: string[] = [
  "東京都新宿区",
  "神奈川県横浜市",
  "埼玉県さいたま市",
  "千葉県千葉市",
  "大阪府大阪市",
  "兵庫県神戸市",
  "京都府京都市",
  "北海道札幌市",
  "北海道函館市",
  "福岡県福岡市",
  "宮城県仙台市",
  "長野県長野市",
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

    // 申込期限は開催日の3日前 23:59(JST)とする。
    // 4件に1件は締切なし(undefined)にし、未設定時の表示挙動も検証できるようにしている。
    const deadlineDate = new Date(base.getTime() - 3 * 24 * 60 * 60 * 1000);
    const dYyyy = deadlineDate.getUTCFullYear();
    const dMm = String(deadlineDate.getUTCMonth() + 1).padStart(2, "0");
    const dDd = String(deadlineDate.getUTCDate()).padStart(2, "0");

    return {
      id: toUuid(index + 1),
      title: `${index % 3 === 0 ? "🦆" : index % 3 === 1 ? "🐟" : "🦋"} 森と水の生き物観察ハイク Vol.${index + 1}`,
      eventDate: `${yyyy}-${mm}-${dd}T${isMorning ? "10:00:00" : "14:00:00"}+09:00`,
      // 開始から2時間後を終了日時とする（詳細画面の終了日時表示の確認用）。
      endDate: `${yyyy}-${mm}-${dd}T${isMorning ? "12:00:00" : "16:00:00"}+09:00`,
      location: `${SAMPLE_LOCATION_POOL[index % SAMPLE_LOCATION_POOL.length]}${
        index % 2 === 0
          ? "青葉の森公園 (ネイチャーセンター前)"
          : "月見湖ビオトープ (東口集合)"
      }`,
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
      // 4件に1件は締切なしにして、申込期限未設定時のUI挙動を検証できるようにしている。
      ...(index % 4 === 3
        ? {}
        : { applicationDeadline: `${dYyyy}-${dMm}-${dDd}T23:59:59+09:00` }),
      // イベント一覧取得の cancelledAt 絞り込み挙動を検証するため、
      // インデックス 0 と 50 のイベントをキャンセル済みとしてマークする。
      ...(index === 0 || index === 50
        ? { cancelledAt: new Date(Date.UTC(2026, 6, 1, 0, 0, 0)).toISOString() }
        : {}),
    };
  });
};

// 申込期限（2026-09-01）を過ぎている一方、開催日（2026-09-30）はまだ先という
// イベントの固定モック。モックユーザー自身の申し込み（2026-08-30）もシードして、
// 「期限を過ぎてからの取り消し」を申し込み操作なしで確認できるようにしている。
// 生成ロジックの index に依存させたくないため、固定値で1件だけ用意する。
const DEADLINE_PASSED_EVENT_ID = toUuid(200);

// 上記イベントの申込期限。取り消し期限も同じ日時に揃える。
const DEADLINE_PASSED_DEADLINE = "2026-09-01T23:59:59+09:00";

const createDeadlinePassedEvent = (): MockEvent => ({
  id: DEADLINE_PASSED_EVENT_ID,
  title: "🍂 六甲山系の外来植物駆除ボランティア（申込期限切れ確認用）",
  eventDate: "2026-09-30T09:00:00+09:00",
  endDate: "2026-09-30T12:00:00+09:00",
  location: "兵庫県神戸市 六甲山系 記念碑台",
  profileId: "profile-1",
  profile: {
    id: "profile-1",
    displayName: "みずべ保全ネットワーク",
    avatarUrl: "https://i.pravatar.cc/150?img=1",
  },
  createdAt: "2026-08-01T09:00:00+09:00",
  tags: SAMPLE_TAG_POOL[0],
  applicationDeadline: DEADLINE_PASSED_DEADLINE,
});

// メモリ内でイベント一覧を管理する（初期値はダミーイベント＋期限切れ確認用の固定イベント）
export const mockEvents: MockEvent[] = [
  ...createInitialDummyEvents(),
  createDeadlinePassedEvent(),
];

const createDefaultMockEventDetail = (
  event: MockEvent,
  index: number,
): MockEventDetail => ({
  ...event,
  organizerName: event.profile.displayName,
  organizerAvatarUrl: event.profile.avatarUrl,
  description: `詳細情報です。自然観察を楽しみましょう。`,
  capacity: 30,
  cancelDeadline: buildCancelDeadline(event, index),
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

// 参加取り消し期限(RFC3339)を算出する。
// 基本は開催日当日の 23:59(JST)を期限とするが、「申し込み内容モーダル」で
// 期限切れ表示を確認できるよう、1件だけ明らかに過去の日時を固定で設定する
// (index === 1 のイベント。id: 00000000-0000-4000-8000-000000000002)。
const buildCancelDeadline = (event: MockEvent, index: number): string => {
  // 期限切れ確認用の固定イベントは、申込期限と同じ日時を取り消し期限とする。
  if (event.id === DEADLINE_PASSED_EVENT_ID) {
    return DEADLINE_PASSED_DEADLINE;
  }
  if (index === 1) {
    return "2024-01-01T23:59:59+09:00";
  }
  const eventDateOnly = event.eventDate.slice(0, 10); // "YYYY-MM-DD" を取り出す
  return `${eventDateOnly}T23:59:59+09:00`;
};

export const mockEventDetails = new Map<string, MockEventDetail>(
  mockEvents.map((event, index) => [
    event.id,
    createDefaultMockEventDetail(event, index),
  ]),
);

// 参加者向けUIの状態確認用に、一部の既存イベントに初期参加者をシードする。
seedEventMembers(toUuid(100), 30); // 満員
seedEventMembers(toUuid(99), 24); // 残りわずか
seedEventMembers(toUuid(98), 15); // 余裕あり
seedEventMembers(toUuid(97), 0); // 参加者なし

// 期限切れ確認用イベントには、モックユーザー自身の申し込みをシードする。
// 申込期限（2026-09-01）より前の 2026-08-30 に申し込んだ状態とし、
// ログイン直後から「申し込み済み」→ 期限を過ぎた申し込み内容モーダルへ進める。
seedMyParticipation(DEADLINE_PASSED_EVENT_ID, {
  appliedAt: "2026-08-30T20:14:00+09:00",
  participants: [
    { category: "大人", headCount: 2 },
    { category: "子ども", headCount: 1 },
  ],
});

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

// 開催状況フィルタ用に、現在時刻と eventDate/endDate から該当状況かを判定する。
const matchesStatus = (event: MockEvent, status: string): boolean => {
  const now = Date.now();
  const start = Date.parse(event.eventDate);
  const end = Date.parse(event.endDate || event.eventDate);
  switch (status) {
    case "upcoming":
      return start > now;
    case "ongoing":
      return start <= now && now <= end;
    case "ended":
      return end < now;
    default:
      return false;
  }
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

  // tagId クエリパラメータの処理。
  // 空値は無視し、UUID形式でない値または21件以上の指定は 400 エラーを返す。
  const rawTagIds = url.searchParams
    .getAll("tagId")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  if (rawTagIds.length > 20) {
    return {
      events: [],
      limit,
      offset,
      totalCount: 0,
      error: {
        code: "invalid_request",
        message: "リクエストボディが不正です",
      },
    };
  }
  const invalidTagId = rawTagIds.find((id) => !isValidUuid(id));
  if (invalidTagId) {
    return {
      events: [],
      limit,
      offset,
      totalCount: 0,
      error: {
        code: "invalid_request",
        message: "リクエストボディが不正です",
      },
    };
  }

  // status クエリパラメータの処理。
  // 空値は無視し、許容値(upcoming / ongoing / ended)以外は 400 エラーを返す。
  // 重複は除去し、定義順(upcoming -> ongoing -> ended)へ並べ替える。
  const VALID_STATUSES = ["upcoming", "ongoing", "ended"];
  const rawStatuses = url.searchParams
    .getAll("status")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const invalidStatus = rawStatuses.find(
    (status) => !VALID_STATUSES.includes(status),
  );
  if (invalidStatus) {
    return {
      events: [],
      limit,
      offset,
      totalCount: 0,
      error: {
        code: "invalid_request",
        message: "開催状況(status)の値が不正です",
      },
    };
  }
  const statuses = VALID_STATUSES.filter((status) =>
    rawStatuses.includes(status),
  );

  // location クエリパラメータの処理。
  // 空値は無視し、1要素255文字超過・重複除去後201件以上は 400 エラーを返す。
  // 重複は NFKC 正規化＋小文字化した値で判定し、SQL へ渡すのは最初に現れた入力値を使う。
  const rawLocations = url.searchParams
    .getAll("location")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const overLengthLocation = rawLocations.find((value) => value.length > 255);
  if (overLengthLocation) {
    return {
      events: [],
      limit,
      offset,
      totalCount: 0,
      error: {
        code: "invalid_request",
        message: "地域(location)に255文字を超える指定はできません",
      },
    };
  }

  const seenLocations = new Set<string>();
  const locations: string[] = [];
  for (const raw of rawLocations) {
    // 重複は NFKC 正規化＋小文字化した値で判定し、SQL へ渡すのは最初に現れた入力値を使う。
    const key = normalizeForKeywordSearch(raw);
    if (seenLocations.has(key)) {
      continue;
    }
    seenLocations.add(key);
    locations.push(raw);
  }
  if (locations.length > 200) {
    return {
      events: [],
      limit,
      offset,
      totalCount: 0,
      error: {
        code: "invalid_request",
        message: "地域(location)は200件以内で指定してください",
      },
    };
  }

  // キャンセル済みイベントは除外しない（バックエンド仕様: status は開催状況=時間軸のみを
  // 表し、キャンセル済みイベントも各 status に混在するため、クライアントは cancelledAt で判別する）。

  // 検索キーワードで絞り込む
  const keywordFiltered = keywords.length
    ? mockEvents.filter((event) => matchesAllKeywords(event, keywords))
    : mockEvents;

  // タグIDで絞り込む（OR 検索）。q と同時指定の場合は AND になる。
  const filteredEvents = rawTagIds.length
    ? keywordFiltered.filter((event) =>
        rawTagIds.some((tagId) =>
          (event.tags ?? []).some((tag) => tag.id === tagId),
        ),
      )
    : keywordFiltered;

  // 開催状況で絞り込む（OR 検索）。q / tagId と同時指定の場合は AND になる。
  const statusFilteredEvents = statuses.length
    ? filteredEvents.filter((event) =>
        statuses.some((status) => matchesStatus(event, status)),
      )
    : filteredEvents;

  // location で絞り込む（OR 検索。events.location への部分一致）。
  // q / tagId / status と同時指定の場合は AND になる。
  const locationFiltered = locations.length
    ? statusFilteredEvents.filter((event) =>
        locations.some((location) =>
          normalizeForKeywordSearch(event.location).includes(
            normalizeForKeywordSearch(location),
          ),
        ),
      )
    : statusFilteredEvents;

  // イベントデータをソートする
  const sortedEvents = [...locationFiltered].sort((left, right) => {
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
    totalCount: locationFiltered.length,
  };
};
