"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { AuthSession } from "@/types/common";
import type { CurrentUser } from "@/types/user";
import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

// 認証セッションと本人プロフィールを配下の画面へ供給する Provider。
//
// 以前は useAuth を各コンポーネントが直接呼んでおり、呼び出した数だけ
// getSession() と onAuthStateChange の購読が作られていた。
// そのため後からマウントされたコンポーネントは、他が既に認証状態を知っていても
// 自分の取得が終わるまで未確定のまま扱う必要があり、
// 例えばイベント詳細の参加ボタンは遷移するたび押せない状態から始まっていた。
// 取得と購読をここへ一本化し、配下は確定済みの状態を即座に受け取れるようにする。

// 認証セッション。プロフィールを必要としない画面はこちらだけを参照する。
type AuthContextValue = {
  // 認証セッション（未ログイン時は null）。
  session: AuthSession | null;
  // ログイン済みかどうか。
  isAuthenticated: boolean;
  // 認証状態がまだ確定していない間は true。プロフィールの取得は待たない。
  isSessionLoading: boolean;
};

// 本人プロフィール。表示名やアイコンを扱う画面はこちらを参照する。
type CurrentUserContextValue = {
  // API から取得したプロフィール（未取得・取得失敗時は null）。
  user: CurrentUser | null;
  // 「ログインユーザーが誰か」がまだ確定していない間は true。
  // 認証状態の確認に加えて、プロフィール取得の結果待ちも含む。
  // 取得が失敗して error が確定した時点で false となるため、
  // 呼び出し側はそこで代替表示へ切り替えられる。
  isUserLoading: boolean;
  // プロフィール取得時のエラーメッセージ（成功時は null）。
  error: string | null;
  // プロフィール更新後に、再取得せず共有状態へ反映するための setter。
  setUser: (user: CurrentUser) => void;
};

// Context を用途別に分けているのは、認証だけを見る画面が
// プロフィール取得の完了で再レンダリングされないようにするため。
const AuthContext = createContext<AuthContextValue | null>(null);
const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { session, isLoading: isSessionLoading } = useAuth();
  const {
    user,
    isLoading: isProfileLoading,
    error,
    setUser,
  } = useCurrentUser(session);

  const authValue = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      isSessionLoading,
    }),
    [session, isSessionLoading],
  );

  const currentUserValue = useMemo<CurrentUserContextValue>(
    () => ({
      user,
      isUserLoading: isSessionLoading || isProfileLoading,
      error,
      setUser,
    }),
    [user, isSessionLoading, isProfileLoading, error, setUser],
  );

  return (
    <AuthContext.Provider value={authValue}>
      <CurrentUserContext.Provider value={currentUserValue}>
        {children}
      </CurrentUserContext.Provider>
    </AuthContext.Provider>
  );
}

// 共有された認証セッションを取得する。AuthProvider の配下でのみ利用できる。
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext は AuthProvider の内側で使用してください");
  }

  return context;
}

// 共有された本人プロフィールを取得する。AuthProvider の配下でのみ利用できる。
export function useCurrentUserContext(): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);

  if (!context) {
    throw new Error(
      "useCurrentUserContext は AuthProvider の内側で使用してください",
    );
  }

  return context;
}
