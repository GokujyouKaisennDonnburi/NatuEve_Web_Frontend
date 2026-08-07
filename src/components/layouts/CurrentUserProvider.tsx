"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { AuthSession } from "@/types/common";
import type { CurrentUser } from "@/types/user";
import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

// ログイン中のユーザー情報を配下の画面で共有するための Context。
//
// 以前はヘッダーとマイページがそれぞれ独立に /api/v1/me を叩いており、
// 同じ情報を二重に取得したうえ、マイページでプロフィールを更新しても
// ヘッダーの表示は次のリロードまで古いままだった。
// 取得と保持をここへ集約することで、取得を1回にまとめ、
// 更新も即座に全画面へ反映されるようにする。
type CurrentUserContextValue = {
  // 認証セッション（未ログイン時は null）。
  session: AuthSession | null;
  // API から取得したプロフィール（未取得・取得失敗時は null）。
  user: CurrentUser | null;
  // 「ログインユーザーが誰か」がまだ確定していない間は true。
  // セッション確認中に加えて、プロフィール取得の結果待ちも含む。
  // 取得が失敗して error が確定した時点で false となるため、
  // 呼び出し側はそこで代替表示へ切り替えられる。
  isLoading: boolean;
  // プロフィール取得時のエラーメッセージ（成功時は null）。
  error: string | null;
  // プロフィール更新後に、再取得せず共有状態へ反映するための setter。
  setUser: (user: CurrentUser) => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { session, isLoading: isSessionLoading } = useAuth();
  const {
    user,
    isLoading: isProfileLoading,
    error,
    setUser,
  } = useCurrentUser(session);

  const value = useMemo<CurrentUserContextValue>(() => {
    // セッション確定後、useCurrentUser の副作用が走るまでの1レンダーは
    // isProfileLoading が false のままユーザー情報も無い状態になる。
    // その隙間で未ログイン表示へ落ちないよう、結果が出ていない間は
    // ローディング扱いとする。
    const isResolving = session !== null && user === null && error === null;

    return {
      session,
      user,
      isLoading: isSessionLoading || isProfileLoading || isResolving,
      error,
      setUser,
    };
  }, [session, user, isSessionLoading, isProfileLoading, error, setUser]);

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

// 共有されたユーザー情報を取得する。CurrentUserProvider の配下でのみ利用できる。
export function useCurrentUserContext(): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);

  if (!context) {
    throw new Error(
      "useCurrentUserContext は CurrentUserProvider の内側で使用してください",
    );
  }

  return context;
}
