// src/app/auth/callback/page.tsx
"use client";

import { ROUTES } from "@/constants/routes";
import { completeOAuthCallback, subscribeAuthSession } from "@/services/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

// 認証コールバックページ
// - Google OAuthのリダイレクト先として使用される。
// - セッションの確立を検知し、成功時はイベント一覧ページへ、失敗時はサインインページへリダイレクトする。
export default function AuthCallbackPage() {
  const router = useRouter(); // useRouterフックを使用してルーターオブジェクトを取得

  // セッションの確立を待って遷移先を決める副作用
  useEffect(() => {
    let handled = false;

    // 成否どちらか一方だけを一度だけ実行する。
    // セッション確立の検知と完了処理の両方から呼ばれるためフラグで制御する。
    const finish = (isSignedIn: boolean) => {
      if (handled) {
        return;
      }

      handled = true;

      if (isSignedIn) {
        toast.success("ログインに成功しました。");
        router.replace(ROUTES.EVENT_LIST);
        return;
      }

      toast.error("ログインに失敗しました。もう一度お試しください。");
      router.replace(ROUTES.SIGNIN);
    };

    // code の交換を経ずにセッションが確立する経路があるため、先に購読しておく
    const unsubscribe = subscribeAuthSession(() => finish(true));

    // PKCE の code をセッションへ交換し、その結果で成功/失敗を判定する
    void completeOAuthCallback()
      .then(finish)
      .catch(() => finish(false));

    // アンマウント時に遷移処理を止め、購読も解除する
    return () => {
      handled = true;
      unsubscribe();
    };
  }, [router]);

  return <p>ログイン中...</p>;
}
