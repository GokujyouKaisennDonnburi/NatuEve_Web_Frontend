export type UserRole = "admin" | "member" | "viewer";

// ユーザーの型定義
export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

// ユーザー一覧のレスポンス型定義
export type UserListResponse = {
  users: User[];
};

// 現在のユーザー情報の型定義
export type MeResponse = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
};

// 現在のユーザー情報をフロントエンドで使用するための型定義
export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
};
