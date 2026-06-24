import { HttpResponse, http } from "msw";

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

export const userHandlers = [
  // 既存のユーザー一覧取得モック
  http.get("/api/users", () => {
    return HttpResponse.json({ users: sampleUsers });
  }),

  // ----------------------------------------------------
  // 自分自身のプロフィール取得モック (/api/v1/me)
  // テストしたい状態に合わせて return を切り替えてください
  // ----------------------------------------------------
  http.get("/api/v1/me", () => {
    // ▼ パターンA: サインイン済み（200 OK とユーザー情報を返す）
    return HttpResponse.json({
      id: "user-1",
      name: "ヌートリウス三世",
      iconUrl:
        "https://images.unsplash.com/photo-1606567595334-d39972c85dbe?w=100&auto=format&fit=crop&q=80",
    });

    // ▼ パターンB: 未サインイン状態（401 Unauthorized を返す）
    // return new HttpResponse(null, { status: 401 });
  }),
];
