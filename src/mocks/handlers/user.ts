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
const sampleCurrentUser = {
  id: "user-1",
  email: "aoi@example.com",
  displayName: "Aoi Tanaka",
  avatarUrl: "https://example.com/avatar.jpg",
  createdAt: "2026-06-24T10:00:00Z",
  updatedAt: "2026-06-24T10:00:00Z",
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

// 認証トークンが有効かどうかをチェックする関数
const hasBearerToken = (authorizationHeader: string | null) =>
  Boolean(authorizationHeader?.startsWith("Bearer "));

// MSWのハンドラーを定義
export const userHandlers = [
  // ユーザー一覧取得モック
  http.get("/api/users", () => {
    return HttpResponse.json({ users: sampleUsers });
  }),

  // 既存の現在のユーザー情報取得モック
  http.get("/api/v1/me", ({ request }) => {
    const authHeader = request.headers.get("authorization");
    if (!hasBearerToken(authHeader)) {
      return HttpResponse.json(
        { error: { code: "unauthorized", message: "認証無効" } },
        { status: 401 },
      );
    }

    // Bearer の後ろのトークン文字列（実際のIDが入っていると仮定）をIDとして流用するハック
    const token = authHeader?.split(" ")[1]?.trim();

    return HttpResponse.json({
      ...sampleCurrentUser,
      id: token || sampleCurrentUser.id, // モックが返す自分のIDもURLと同じになるようにする
    });
  }),

  // 指定したIDのユーザープロフィール取得API
  http.get("/api/v1/users/:id", ({ params }) => {
    const { id } = params;
    // idが存在することを保証（文字列型にキャスト）
    const userId = typeof id === 'string' ? id : 'unknown';
    
    // まずは事前定義されたモックデータ(user-1, user-2)を探す
    const user = sampleUserProfiles.find((u) => u.id === userId);

    if (user) {
      return HttpResponse.json(user);
    }

    // 未知のID（実際のGoogleアカウントIDなど）が来た場合のフォールバック
    // そのIDを持った動的なモックユーザーを生成して返す
    const dynamicUser = {
      id: userId,
      displayName: "ログインユーザー (動的モック)",
      // IDをシード値にして、ランダムだけどIDごとに固定のアイコンを生成する無料サービスを利用
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userId)}`,

      bio: "Googleアカウントでログイン中の動的モックプロフィールです。\n（実際のAPIが完成するまでの仮データです）",
    };

    return HttpResponse.json(dynamicUser);
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
    // 疑似的なネットワーク遅延（1秒）を発生させて、保存中のUIを確認できるようにする
    await delay(1000); 

    try {
      const body = await request.json();
      
      // 実際はここでデータベースを更新しますが、今回はモックなので成功レスポンスを返すだけ
      return HttpResponse.json({ 
        success: true, 
        message: "プロフィールを更新しました",
        updatedData: body 
      });
    } catch (error) {
      return HttpResponse.json({ error: "無効なリクエストです" }, { status: 400 });
    }
  }),

  // 2. アイコン画像のアップロード・更新 (POST)
  http.post("/api/v1/users/:id/avatar", async ({ params }) => {
    // 画像アップロードは少し時間がかかる想定（1.5秒）
    await delay(1500);

    const { id } = params;
    
    // 実際は送信された FormData からファイルを取り出し、S3などにアップロードします。
    // 今回はモックとして、「更新されるたびに違う画像が返ってくる」ように
    // 現在のタイムスタンプをシード値にしたダミーの画像URLを生成して返します。
    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}-${Date.now()}`;

    return HttpResponse.json({ 
      success: true,
      avatarUrl: newAvatarUrl 
    });
  }),

];
