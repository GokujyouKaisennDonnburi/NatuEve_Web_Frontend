import { supabase } from "@/lib/supabase";

// API のベース URL。未設定なら相対パス（開発時は MSW がモックする）。
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// APIリクエスト用のカスタムfetch関数を定義
type ApiFetchOptions = RequestInit & {
  auth?: boolean;
};

// 相対パス（"/api/..." 等）の場合のみベース URL を前置する。
// 署名付き URL への直 PUT など絶対 URL はそのまま使う。
const resolveUrl = (input: RequestInfo | URL): RequestInfo | URL => {
  if (typeof input === "string" && input.startsWith("/")) {
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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // セッションが存在する場合は、AuthorizationヘッダーにBearerトークンを設定
    if (session?.access_token) {
      mergedHeaders.set("Authorization", `Bearer ${session.access_token}`);
    }
  }

  return fetch(resolveUrl(input), {
    ...rest,
    headers: mergedHeaders,
  });
}
