// ユーザーの型定義
export type User = {
  id: string;
  name: string;
  email: string;
};

// ユーザー一覧のレスポンス型定義
export type UserListResponse = {
  users: User[];
};

// 本人プロフィール取得 API（GET /api/v1/me）のレスポンス DTO。
// バックエンドの ProfileResponse は camelCase を返すため、それに合わせる。
export type MeResponse = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  // 自己紹介文（任意）
  description?: string;
  createdAt: string;
  updatedAt: string;
};

// 現在のユーザー情報をフロントエンドで使用するための型定義
export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  // 自己紹介文（任意）
  description?: string;
  createdAt: string;
  updatedAt: string;
};

// 本人プロフィール更新 API（PATCH /api/v1/me）のリクエスト DTO。
// バックエンドの UpdateProfileRequest だけは snake_case を受け取るため、
// レスポンス（camelCase）と規則が異なる点に注意する。
export type UpdateMyProfileRequest = {
  display_name?: string;
  description?: string;
};

// 本人プロフィール更新 API のレスポンス DTO。
// 更新後のプロフィール全体を返すため MeResponse と同じ形。
export type UpdateMyProfileResponse = MeResponse;

// 他人のプロフィール取得 API（GET /api/v1/profiles/{id}）のレスポンス DTO。
export type UserProfileResponse = {
  id: string;
  displayName: string;
  avatarUrl: string;
  description?: string;
};
