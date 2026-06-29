import { HttpResponse, http } from "msw";

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
const hasBearerToken = (authorizationHeader: string | null) =>
  Boolean(authorizationHeader?.startsWith("Bearer "));

// MSWのハンドラーを定義
export const userHandlers = [
  // ユーザー一覧取得モック
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
