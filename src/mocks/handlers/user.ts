import { HttpResponse, http } from "msw";

import { MOCK_AUTH_SESSION } from "@/services/mockAuth";
import type { UserProfileResponse } from "@/types/user";

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

// 他人プロフィール取得（GET /api/v1/profiles/:id）用のダミーデータ。
// 実 API の ProfilePublic と同じ形（camelCase）で返す。
//
// キーはアプリ内のモックデータが実際に持つプロフィールIDに揃えてある。
// - profile-1〜6: イベントモック（handlers/events/data.ts）の主催者
// - MOCK_AUTH_SESSION.userId: ログイン中のモックユーザー本人
// ここに無いIDは実 API と同じく 404 を返し、Not Found 表示も検証できるようにする。
const sampleUserProfiles: Readonly<Record<string, UserProfileResponse>> = {
  "profile-1": {
    id: "profile-1",
    displayName: "ナチュビト公式",
    avatarUrl: "https://i.pravatar.cc/150?img=1",
    description: "自然体験イベントの企画・運営をしています。",
  },
  "profile-2": {
    id: "profile-2",
    displayName: "森の案内人・山田",
    avatarUrl: "https://i.pravatar.cc/150?img=2",
    description: "週末はよく登山に行きます。自然が大好きです！",
  },
  "profile-3": {
    id: "profile-3",
    displayName: "ナチュビト公式",
    // アバター未設定（空文字）の表示を確認するためのケース
    avatarUrl: "",
    description: "海沿いのクリーン活動をメインに活動しています。",
  },
  "profile-4": {
    id: "profile-4",
    displayName: "森の案内人・山田",
    avatarUrl: "https://i.pravatar.cc/150?img=4",
    // 自己紹介未設定（空文字）の表示を確認するためのケース
    description: "",
  },
  "profile-5": {
    id: "profile-5",
    displayName: "ナチュビト公式",
    avatarUrl: "https://i.pravatar.cc/150?img=5",
    description: "生き物観察ハイクを毎月開催しています。",
  },
  "profile-6": {
    id: "profile-6",
    displayName: "森の案内人・山田",
    avatarUrl: "https://i.pravatar.cc/150?img=6",
    description: "ビオトープの保全活動をしています。",
  },
  [MOCK_AUTH_SESSION.userId]: {
    id: MOCK_AUTH_SESSION.userId,
    displayName: MOCK_AUTH_SESSION.name ?? "モックユーザー",
    avatarUrl: MOCK_AUTH_SESSION.iconUrl ?? "",
    description: "モック環境でのテスト用プロフィールです。",
  },
};

// ユーザー別イベント用ダミーデータ
const sampleUserEvents = {
  hosted: [
    {
      id: "00000000-0000-4000-8000-000000000101",
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

// ▼ マイページ用の初期モックデータ（メモリ上に保持）
const myProfile = {
  // MeResponse 契約（camelCase）に合わせる
  avatarUrl: "https://github.com/shadcn.png", // 代替アイコンのテスト用。空文字 "" にするとデフォルトの人型アイコンが出ます
  createdAt: "2026-06-22T12:00:00Z",
  description: "イベントを楽しむのが好きです。よろしくお願いします！",
  displayName: "なちゅいべ太郎",
  email: "user@example.com",
  id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  updatedAt: "2026-06-22T12:00:00Z",
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

    // 送られてきたJSONを受け取る
    // （リクエストのみ snake_case。レスポンスは camelCase なので実 API と揃える）
    const body = (await request.json()) as {
      display_name?: string;
      description?: string;
    };

    // 更新処理: 値が存在すれば書き換える
    if (body.display_name !== undefined) {
      myProfile.displayName = body.display_name;
    }
    if (body.description !== undefined) {
      myProfile.description = body.description;
    }

    // 更新日時を現在時刻に更新
    myProfile.updatedAt = new Date().toISOString();

    // 更新後のプロフィールを返す
    return HttpResponse.json(myProfile);
  }),

  // ------------------------------------------
  // 他人のプロフィール取得 (GET /api/v1/profiles/:id)
  // ------------------------------------------
  http.get("/api/v1/profiles/:id", ({ params }) => {
    const id = String(params.id ?? "");
    const profile = sampleUserProfiles[id];

    // 未登録のIDは実 API と同じく 404 Not Found を返す
    if (!profile) {
      return HttpResponse.json(
        { error: { code: "not_found", message: "リソースが見つかりません" } },
        { status: 404 },
      );
    }

    return HttpResponse.json(profile);
  }),

  // 指定したIDのユーザーが主催したイベント取得API
  http.get("/api/v1/users/:id/events/hosted", () => {
    return HttpResponse.json({ events: sampleUserEvents.hosted });
  }),

  // 指定したIDのユーザーが参加したイベント取得API
  http.get("/api/v1/users/:id/events/participated", () => {
    return HttpResponse.json({ events: sampleUserEvents.participated });
  }),
];
