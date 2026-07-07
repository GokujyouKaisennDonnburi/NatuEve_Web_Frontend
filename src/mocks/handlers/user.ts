import { HttpResponse, delay, http } from "msw";

// ============================================
// ユーザー系モックのダミーデータと補助関数
// ============================================

// ダミーユーザーデータ（GET /api/users で返すサンプルユーザー一覧）
const sampleUsers = [
  {
    id: "user-1",
    name: "Aoi Tanaka",
    email: "aoi@example.com",
  },
  {
    id: "user-2",
    name: "Ren Sato",
    email: "ren@example.com",
  },
  {
    id: "user-3",
    name: "Mina Suzuki",
    email: "mina@example.com",
  },
];

// ダミーの現在のユーザー情報（GET /api/v1/me で返すモックユーザープロフィール）
// MeResponse 型（snake_case）に合わせる
const _sampleCurrentUser = {
  id: "user-1",
  email: "aoi@example.com",
  display_name: "Aoi Tanaka",
  avatar_url: "https://example.com/avatar.jpg",
  created_at: "2026-06-24T10:00:00Z",
  updated_at: "2026-06-24T10:00:00Z",
};

// 認証トークンが有効かどうかをチェックする補助関数
// （Bearer トークンが付与されているかを確認するのに使用）
// プロフィール詳細用ダミーデータ (マイページ・他人のページ表示用)
const sampleUserProfiles = [
  {
    id: "user-1", // 自分のIDとして扱う
    displayName: "Aoi Tanaka",
    avatarUrl: "https://example.com/avatar.jpg",
    bio: "週末はよく登山に行きます。自然が大好きです！\nよろしくお願いします。",
  },
  {
    id: "user-2", // 他人のIDとして扱う
    displayName: "Ren Sato",
    avatarUrl: "",
    bio: "海沿いのクリーン活動をメインに活動しています。",
  },
  {
    id: "mock-access-token", // モック環境でのテスト用
    displayName: "モックユーザー",
    avatarUrl: "https://example.com/avatar.jpg",
    bio: "モック環境でのテスト用プロフィールです。",
  },
];

// ユーザー別イベント用ダミーデータ
const sampleUserEvents = {
  hosted: [
    {
      id: "101",
      title: "高尾山クリーンハイク",
      location: "東京都 高尾山",
      createdAt: "2026-06-01T10:00:00Z",
      eventDate: "2026-07-15T09:00:00Z",
      profileId: "user-1",
    },
  ],
  participated: [
    /*{
      id: "201",
      title: "代々木公園ピクニック＆ゴミ拾い",
      location: "東京都 代々木公園",
      createdAt: "2026-05-20T10:00:00Z",
      eventDate: "2026-06-10T10:00:00Z",
      profileId: "user-2",
    },*/
  ],
};

// ユーザープロフィール更新用リクエスト型
type UpdateUserProfileRequest = {
  displayName?: string;
  bio?: string;
};
// ▼ マイページ用の初期モックデータ（メモリ上に保持）
const myProfile = {
  // MeResponse 契約（snake_case）に合わせる
  avatar_url: "https://github.com/shadcn.png", // 代替アイコンのテスト用。空文字 "" にするとデフォルトの人型アイコンが出ます
  created_at: "2026-06-22T12:00:00Z",
  description: "イベントを楽しむのが好きです。よろしくお願いします！",
  display_name: "なちゅいべ太郎",
  email: "user@example.com",
  id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  updated_at: "2026-06-22T12:00:00Z",
};

// 認証トークンが有効かどうかをチェックする関数
const hasBearerToken = (authorizationHeader: string | null) =>
  Boolean(authorizationHeader?.startsWith("Bearer "));

// MSWのハンドラーを定義
export const userHandlers = [
  // ユーザー一覧取得モック
  http.get("/api/users", () => {
    return HttpResponse.json({ users: sampleUsers });
  }),

  http.get("/api/v1/me", ({ request }) => {
    const authHeader = request.headers.get("authorization");
    if (!hasBearerToken(authHeader)) {
      return HttpResponse.json(
        { error: { code: "unauthorized", message: "認証無効" } },
        { status: 401 },
      );
    }

    const token = authHeader?.split(" ")[1]?.trim();

    return HttpResponse.json({
      ...myProfile,
      id: token || myProfile.id,
    });
  }),

  // ------------------------------------------
  // 2. 本人プロフィール更新 (PATCH /api/v1/me)
  // ------------------------------------------
  http.patch("/api/v1/me", async ({ request }) => {
    const authHeader = request.headers.get("authorization");
    if (!hasBearerToken(authHeader)) {
      return HttpResponse.json(
        { error: { code: "unauthorized", message: "認証無効" } },
        { status: 401 },
      );
    }

    // 送られてきたJSONを受け取る (スネークケースで送られてくる想定)
    const body = (await request.json()) as {
      display_name?: string;
      description?: string;
    };

    // 更新処理: 値が存在すれば書き換える
    if (body.display_name !== undefined) {
      myProfile.display_name = body.display_name;
    }
    if (body.description !== undefined) {
      myProfile.description = body.description;
    }

    // 更新日時を現在時刻に更新
    myProfile.updated_at = new Date().toISOString();

    // 更新後のプロフィールを返す
    return HttpResponse.json(myProfile);
  }),

  // ------------------------------------------
  // 他人のプロフィール取得 (GET /api/v1/profiles/:id)
  // ------------------------------------------
  http.get('/api/v1/profiles/:id', ({ params }) => {
    const { id } = params;

    // "other-user" 以外のIDが指定された場合は 404 Not Found を返す
    if (id !== "other-user") {
      return HttpResponse.json(
        { error: { code: "not_found", message: "リソースが見つかりません" } },
        { status: 404 }
      );
    }

    // id が "other-user" の場合のみ正常データを返す
    return HttpResponse.json({
      id: id,
      displayName: "他のユーザーさん",
      avatarUrl: "https://github.com/shadcn.png",
      description: "これはAPIから取得した他のユーザーの自己紹介文です。よろしくおねがいします！",
    });
  }),

  // 指定したIDのユーザーが主催したイベント取得API
  http.get("/api/v1/users/:id/events/hosted", () => {
    return HttpResponse.json({ events: sampleUserEvents.hosted });
  }),

  // 指定したIDのユーザーが参加したイベント取得API
  http.get("/api/v1/users/:id/events/participated", () => {
    return HttpResponse.json({ events: sampleUserEvents.participated });
  }),

  // 1. プロフィールテキスト情報（名前・自己紹介）の更新 (PATCH)
  http.patch("/api/v1/users/:id", async ({ request, params }) => {
    await delay(1000);

    try {
      const body = (await request.json()) as UpdateUserProfileRequest;
      const { id } = params;
      const userId = typeof id === "string" ? id : "unknown";

      // モックデータベース（配列）から該当ユーザーを探して直接書き換える
      const userIndex = sampleUserProfiles.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        if (body.displayName !== undefined) {
          sampleUserProfiles[userIndex].displayName = body.displayName;
        }
        if (body.bio !== undefined) {
          sampleUserProfiles[userIndex].bio = body.bio;
        }
      }

      return HttpResponse.json({
        success: true,
        message: "プロフィールを更新しました",
        updatedData: body,
      });
    } catch (_error) {
      return HttpResponse.json(
        { error: "無効なリクエストです" },
        { status: 400 },
      );
    }
  }),
];
