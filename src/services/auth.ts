// src/services/auth.ts
import { supabase } from "@/lib/supabase";
import {
  MOCK_AUTH_SESSION,
  clearMockAuthSession,
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

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;

  return false;
}

// サインアウト（戻り値なし・画面遷移しない）
export async function signOut(): Promise<void> {
  // モック認証が有効な場合は、モックセッションをクリアする
  if (isMockAuthEnabled()) {
    clearMockAuthSession();
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
