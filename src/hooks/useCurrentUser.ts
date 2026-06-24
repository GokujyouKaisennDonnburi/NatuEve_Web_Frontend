"use client";

import { useEffect, useState } from "react";
import { fetchCurrentUser } from "@/services/user";
import type { AuthSession } from "@/types/common";
import type { CurrentUser } from "@/types/user";

// カスタムフック: 現在のユーザー情報を取得する
type UseCurrentUserState = {
  user: CurrentUser | null;
  isLoading: boolean;
  error: string | null;
};

// カスタムフック: 現在のユーザー情報を取得する
export function useCurrentUser(
  session: AuthSession | null,
): UseCurrentUserState {
  // ユーザー情報、ロード状態、エラー状態を管理するステートを定義
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // セッションが変化したときにユーザー情報を取得する副作用を定義
  useEffect(() => {
    let cancelled = false;

    // セッションが存在しない場合はユーザー情報をリセットして終了
    if (!session) {
      setUser(null);
      setError(null);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    // ユーザー情報を取得する前にロード状態を設定し、エラー状態をリセット
    setIsLoading(true);
    setError(null);

    // ユーザー情報を取得する非同期関数を呼び出し、結果に応じてステートを更新
    void fetchCurrentUser()
      .then((nextUser) => {
        if (!cancelled) {
          setUser(nextUser);
        }
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setUser(null);
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unknown error",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  return {
    user,
    isLoading,
    error,
  };
}
