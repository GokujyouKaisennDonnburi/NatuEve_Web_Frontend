import { apiFetch } from "@/services/apiClient";
import type {
  CurrentUser,
  MeResponse,
  User,
  UserListResponse,
} from "@/types/user";

// ユーザー一覧を取得する関数
export async function fetchUsers(): Promise<User[]> {
  const response = await apiFetch("/api/users", { auth: false });

  // レスポンスが正常でない場合はエラーをスロー
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  const data = (await response.json()) as UserListResponse;
  return data.users;
}

// 現在のユーザー情報を取得する関数
export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await apiFetch("/api/v1/me");

  // レスポンスが正常でない場合はエラーをスロー
  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  // レスポンスをMeResponse型としてパース
  const data = (await response.json()) as MeResponse;

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
