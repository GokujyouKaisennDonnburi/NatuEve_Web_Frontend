// このファイルは、アプリケーション内で使用されるルート（URLパス）を定義するための定数をまとめたものです。
// ルートを一元管理することで、URLの変更があった場合でも、コード全体での修正箇所を最小限に抑えることができます。
export const ROUTES = {
  HOME: "/event-list",
  EVENT_LIST: "/event-list",
  SIGNIN: "/signin",
  USERS: "/users",
  DOCS: "/docs",
  EVENT_POST: "/event-post",
  AUTH_CALLBACK: "/auth/callback",
} as const;

// 公開ルートと保護されたルートを定義
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.EVENT_LIST,
  ROUTES.SIGNIN,
  ROUTES.AUTH_CALLBACK,
  ROUTES.USERS,
  ROUTES.DOCS,
] as const;

// 保護されたルートを定義
export const PROTECTED_ROUTES = [ROUTES.EVENT_POST] as const;
