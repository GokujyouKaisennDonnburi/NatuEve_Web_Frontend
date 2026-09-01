// src/services/auth.ts
import { getSupabase } from "@/lib/supabase";
import {
  MOCK_AUTH_SESSION,
  clearMockAuthSession,
  getMockAuthSession,
  isMockAuthEnabled,
  setMockAuthSession,
  syncMockWorker,
} from "@/services/mockAuth";

// Googleログインへリダイレクト（モック時はセッションを保存して true を返す）
export async function signInWithGoogle(): Promise<boolean> {
  if (isMockAuthEnabled()) {
    await syncMockWorker(true);
    setMockAuthSession(MOCK_AUTH_SESSION);
    return true;
  }

  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;

  return false;
}

// OAuth コールバックの完了処理。
//
// リダイレクト URL に PKCE の code があればセッションへ交換し、
// 最終的にセッションが確立したかどうかを返す。
// 交換に失敗した場合は例外を送出し、呼び出し側にログイン失敗として扱わせる。
//
// セッションの中身は返さない。user_metadata から AuthSession への変換は
// useAuth の buildSession に一本化しており、ここで再実装すると
// 同じマッピングが2つに増えてズレる（#175 で削除した getSession と同じ轍）。
// 呼び出し側もセッションの有無しか見ないため、boolean で足りる。
export async function completeOAuthCallback(): Promise<boolean> {
  // モック認証が有効な場合は、保存済みモックセッションの有無で判定する
  if (isMockAuthEnabled()) {
    return getMockAuthSession() !== null;
  }

  const code = new URLSearchParams(window.location.search).get("code");
  if (code) {
    const { error } = await getSupabase().auth.exchangeCodeForSession(code);
    if (error) throw error;
  }

  const {
    data: { session },
    error,
  } = await getSupabase().auth.getSession();
  if (error) throw error;

  return session !== null;
}

// セッションが確立した瞬間を検知するコールバックを登録し、解除関数を返す。
//
// 一度きりの制御や画面遷移は呼び出し側の責務とする。
// lib/supabase は detectSessionInUrl: true のため、PKCE の code 交換を
// 経由せずセッションが確立する経路があり、その取りこぼしを防ぐために使う。
export function subscribeAuthSession(onEstablished: () => void): () => void {
  // モック認証時はセッションの確立を待つ必要がないため購読しない
  if (isMockAuthEnabled()) {
    return () => undefined;
  }

  const {
    data: { subscription },
  } = getSupabase().auth.onAuthStateChange((_event, session) => {
    if (session) {
      onEstablished();
    }
  });

  return () => subscription.unsubscribe();
}

// サインアウト（戻り値なし・画面遷移しない）
export async function signOut(): Promise<void> {
  // モック認証が有効な場合は、モックセッションをクリアする
  if (isMockAuthEnabled()) {
    clearMockAuthSession();
    return;
  }

  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}
