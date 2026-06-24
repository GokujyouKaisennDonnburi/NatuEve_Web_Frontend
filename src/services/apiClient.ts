import { supabase } from "@/lib/supabase";

// APIリクエスト用のカスタムfetch関数を定義
type ApiFetchOptions = RequestInit & {
  auth?: boolean;
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

  return fetch(input, {
    ...rest,
    headers: mergedHeaders,
  });
}
