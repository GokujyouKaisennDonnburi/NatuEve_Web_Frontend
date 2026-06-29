// src/hooks/useAuth.ts
"use client";

import { supabase } from "@/lib/supabase";
import { signInWithGoogle, signOut } from "@/services/auth";
import {
  getMockAuthSession,
  isMockAuthEnabled,
  subscribeMockAuthSession,
  syncMockWorker,
} from "@/services/mockAuth";
import type { AuthSession } from "@/types/common";
import { useEffect, useState } from "react";

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

  // useEffectフックを使用して認証状態の変化を監視
  useEffect(() => {
    // モック認証が有効な場合の処理
    if (isMockAuthEnabled()) {
      let cancelled = false;

      // モック認証のセッションを同期し、セッションが変化した場合に更新する
      void syncMockWorker(true).then(() => {
        if (cancelled) {
          return;
        }

        setSession(getMockAuthSession());
        setIsLoading(false);
      });

      const unsubscribe = subscribeMockAuthSession(() => {
        if (cancelled) {
          return;
        }

        setSession(getMockAuthSession());
        setIsLoading(false);
      });

      return () => {
        cancelled = true;
        unsubscribe();
      };
    }

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
