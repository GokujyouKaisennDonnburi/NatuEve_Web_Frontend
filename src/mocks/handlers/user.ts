import { HttpResponse, http } from "msw";

// ダミーイベントデータを生成
const sampleUsers = [
  {
    id: "user-1",
    name: "Aoi Tanaka",
    email: "aoi@example.com",
    role: "admin",
  },
  {
    id: "user-2",
    name: "Ren Sato",
    email: "ren@example.com",
    role: "member",
  },
  {
    id: "user-3",
    name: "Mina Suzuki",
    email: "mina@example.com",
    role: "viewer",
  },
];

// ダミーの現在のユーザー情報
const sampleCurrentUser = {
  id: "user-1",
  email: "aoi@example.com",
  display_name: "Aoi Tanaka",
  avatar_url: "https://example.com/avatar.jpg",
  created_at: "2026-06-24T10:00:00Z",
  updated_at: "2026-06-24T10:00:00Z",
};

// 認証トークンが有効かどうかをチェックする関数
const hasBearerToken = (authorizationHeader: string | null) =>
  Boolean(authorizationHeader?.startsWith("Bearer "));

// MSWのハンドラーを定義
export const userHandlers = [
  // 既存のユーザー一覧取得モック
  http.get("/api/users", () => {
    return HttpResponse.json({ users: sampleUsers });
  }),
  // 現在のユーザー情報取得モック
  http.get("/api/v1/me", ({ request }) => {
    // 認証トークンが無効な場合は401エラーを返す
    if (!hasBearerToken(request.headers.get("authorization"))) {
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

    return HttpResponse.json(sampleCurrentUser);
  }),
];
