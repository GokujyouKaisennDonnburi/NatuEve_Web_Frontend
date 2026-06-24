// src/hooks/useAuth.ts
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle, signOut } from "@/services/auth";
import type { AuthSession } from "@/types/common";

// Supabaseのユーザーメタデータの型定義
type SupabaseUserMetadata = {
  full_name?: string;
  name?: string;
  avatar_url?: string;
  picture?: string;
};

// AuthSessionを構築する関数
const buildSession = (session: {
  user: {
    id: string;
    email?: string | null;
    user_metadata?: SupabaseUserMetadata | null;
  };
  access_token: string;
}): AuthSession => {
  const metadata = session.user.user_metadata ?? {}; // Supabaseのユーザーメタデータを取得（nullの場合は空オブジェクト）

  return {
    userId: session.user.id,
    token: session.access_token,
    name:
      metadata.full_name ?? metadata.name ?? session.user.email ?? undefined,
    iconUrl: metadata.avatar_url ?? metadata.picture,
  };
};

// カスタムフック: 認証状態を管理する
export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null); // 認証セッションの状態を保持するステート
  const [isLoading, setIsLoading] = useState(true); // 認証状態のロード中かどうかを示すステート

  useEffect(() => {
    // 初期セッション確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(buildSession(session));
      }

      setIsLoading(false); // 認証状態のロードが完了したことを示す
    });

    // セッション変化を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ? buildSession(session) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    session,
    isAuthenticated: session !== null,
    isLoading,
    loginWithGoogle: signInWithGoogle,
    logout: signOut,
  };
}
