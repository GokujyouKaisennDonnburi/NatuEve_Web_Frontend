// APIレスポンスの型定義
export type ApiListResponse<T> = {
  items: T[];
  total: number;
};

// 認証セッションの型定義
export type AuthSession = {
  userId: string;
  token: string;
  name?: string;
  email?: string;
  iconUrl?: string;
};
