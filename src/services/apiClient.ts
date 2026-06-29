import { supabase } from "@/lib/supabase";
import {
  getMockAuthSession,
  isMockAuthEnabled,
  syncMockWorker,
} from "@/services/mockAuth";

// API のベース URL。未設定なら相対パス（開発時は MSW がモックする）。
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(
  /\/$/,
  "",
);

// APIリクエスト用のカスタムfetch関数を定義
type ApiFetchOptions = RequestInit & {
  auth?: boolean;
};

// 相対パス（"/api/..." 等）の場合のみベース URL を前置する。
// ただしモック有効時は、相対パスのままとする（MSW がインターセプト可能に）。
// 署名付き URL への直 PUT など絶対 URL はそのまま使う。
const resolveUrl = (input: RequestInfo | URL): RequestInfo | URL => {
  if (typeof input === "string" && input.startsWith("/")) {
    // モック有効時は相対パスのみを使用（MSW でインターセプト可能）
    if (isMockAuthEnabled()) {
      return input;
    }
    // 実 API 時は NEXT_PUBLIC_API_BASE_URL を前置
    return `${API_BASE_URL}${input}`;
  }
  return input;
};

// ヘッダーをマージする関数を定義
const mergeHeaders = (headers: HeadersInit | undefined) => {
  const mergedHeaders = new Headers(headers);
  mergedHeaders.set("Accept", "application/json");
  return mergedHeaders;
};

// APIリクエストを行う関数を定義
export async function apiFetch(
  input: RequestInfo | URL,
  init: ApiFetchOptions = {},
) {
  const { auth = true, headers, ...rest } = init; // authオプションをデフォルトでtrueに設定
  const mergedHeaders = mergeHeaders(headers); // ヘッダーをマージ

  // 認証が必要な場合は、Supabaseのセッションからアクセストークンを取得してAuthorizationヘッダーに設定
  if (auth) {
    if (isMockAuthEnabled()) {
      await syncMockWorker(true);
      const mockSession = getMockAuthSession();
      if (mockSession?.token) {
        mergedHeaders.set("Authorization", `Bearer ${mockSession.token}`);
      }
    } else {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // セッションが存在する場合は、AuthorizationヘッダーにBearerトークンを設定
      if (session?.access_token) {
        mergedHeaders.set("Authorization", `Bearer ${session.access_token}`);
      }
    }
  }

  return fetch(resolveUrl(input), {
    ...rest,
    headers: mergedHeaders,
  });
}
