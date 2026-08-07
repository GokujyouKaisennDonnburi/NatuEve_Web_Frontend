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
  // プロフィール更新後に、再取得せず手元の状態へ反映するための setter。
  setUser: (user: CurrentUser) => void;
};

// カスタムフック: 現在のユーザー情報を取得する
export function useCurrentUser(
  session: AuthSession | null,
): UseCurrentUserState {
  // ユーザー情報、ロード状態、エラー状態を管理するステートを定義
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 依存はセッションオブジェクトではなくユーザーIDとする。
  // useAuth の buildSession はセッション変化のたびに新しいオブジェクトを返すため、
  // オブジェクトを依存にするとトークン更新のたびに再取得が走り、ヘッダーがちらつく。
  // API へ付与するトークンは apiFetch が呼び出し時に取得するので依存に含めない。
  const userId = session?.userId ?? null;

  // 現在保持している state が、どのユーザーに対するものかを覚えておく。
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  // ログインユーザーが変わったら、前のユーザーの情報をレンダー中に破棄する。
  //
  // useEffect は描画の後に走るため、そこでリセットすると
  // ログアウト直後の1フレームだけ前のユーザーの情報が表示されてしまう
  // （ヘッダーが一瞬ログイン状態に見える）。ユーザー切替時はさらに問題で、
  // 別人の表示名とアイコンが出てしまう。
  // レンダー中の setState は描画前に再レンダーされるため、この隙間が生まれない。
  if (loadedUserId !== userId) {
    setLoadedUserId(userId);
    setUser(null);
    setError(null);
    // ログイン中なら、この後の副作用で取得するので最初からローディング扱いにする。
    setIsLoading(userId !== null);
  }

  // ログインユーザーが変わったときにユーザー情報を取得する副作用を定義
  useEffect(() => {
    // 未ログイン時は取得しない。state のリセットはレンダー中に済んでいる。
    if (!userId) {
      return;
    }

    let cancelled = false;

    // ユーザー情報を取得する非同期関数を呼び出し、結果に応じてステートを更新
    void fetchCurrentUser()
      .then((nextUser) => {
        if (!cancelled) {
          setUser(nextUser);
        }
      })
      .catch((caughtError) => {
        // 呼び出し側は代替表示へ切り替えるだけで画面にエラーを出さないため、
        // 原因を追えるようコンソールには必ず残す。
        console.error("Failed to fetch current user", caughtError);

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
  }, [userId]);

  return {
    user,
    isLoading,
    error,
    setUser,
  };
}
