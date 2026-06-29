// src/services/auth.ts
import { supabase } from "@/lib/supabase";
import {
  MOCK_AUTH_SESSION,
  clearMockAuthSession,
  getMockAuthSession,
  isMockAuthEnabled,
  setMockAuthSession,
  syncMockWorker,
} from "@/services/mockAuth";
import type { AuthSession } from "@/types/common";

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

// セッション取得（コールバック後に呼ぶ）
export async function getSession(): Promise<AuthSession | null> {
  // モック認証が有効な場合は、モックセッションを返す
  if (isMockAuthEnabled()) {
    return getMockAuthSession();
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  // Supabaseのユーザーメタデータを型アサーションして取得
  const metadata = session.user.user_metadata as {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };

  return {
    userId: session.user.id, // Supabaseの sub (UUID)
    token: session.access_token, // GoバックエンドへのBearer token
    name:
      metadata.full_name ?? metadata.name ?? session.user.email ?? undefined,
    iconUrl: metadata.avatar_url ?? metadata.picture,
  };
}
