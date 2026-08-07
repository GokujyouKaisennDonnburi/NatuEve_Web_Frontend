import { apiFetch } from "@/services/apiClient";
import type {
  CurrentUser,
  MeResponse,
  UpdateMyProfileRequest,
  UpdateMyProfileResponse,
  User,
  UserListResponse,
  UserProfileResponse,
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

// API の DTO（MeResponse）を画面表示用の CurrentUser に変換する。
// GET / PATCH のどちらも同じ DTO を返すため、変換処理はここに集約する。
const toCurrentUser = (data: MeResponse): CurrentUser => ({
  id: data.id,
  email: data.email,
  displayName: data.displayName,
  avatarUrl: data.avatarUrl,
  description: data.description,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

// 現在のユーザー情報を取得する関数
export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await apiFetch("/api/v1/me");

  // レスポンスが正常でない場合はエラーをスロー
  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  // レスポンスをMeResponse型としてパース
  const data = (await response.json()) as MeResponse;

  return toCurrentUser(data);
}

// 本人プロフィール更新 API（PATCH /api/v1/me）を呼ぶ（要認証）。
//
// 指定した項目のみ更新し、更新後のプロフィール全体を CurrentUser で返す。
// 失敗した場合は例外を送出し、呼び出し側の処理を中断させる。
export async function updateMyProfile(
  payload: UpdateMyProfileRequest,
): Promise<CurrentUser> {
  const response = await apiFetch("/api/v1/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw Object.assign(
      new Error(
        `プロフィールの更新に失敗しました (Status: ${response.status})`,
      ),
      { status: response.status },
    );
  }

  return toCurrentUser((await response.json()) as UpdateMyProfileResponse);
}

// 他人のプロフィール取得 API（GET /api/v1/profiles/{id}）を呼ぶ（認証不要）。
//
// 存在しないIDを指定した場合は 404 となるため例外を送出する。
export async function fetchUserProfile(
  userId: string,
): Promise<UserProfileResponse> {
  const response = await apiFetch(
    `/api/v1/profiles/${encodeURIComponent(userId)}`,
    { auth: false },
  );

  if (!response.ok) {
    throw new Error(
      `プロフィールの取得に失敗しました (Status: ${response.status})`,
    );
  }

  return (await response.json()) as UserProfileResponse;
}
