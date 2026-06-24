// src/app/auth/callback/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routes";
import { supabase } from "@/lib/supabase";

// 認証コールバックページ
// - Google OAuthのリダイレクト先として使用される。
// - 認証状態の変化を監視し、成功時はイベント一覧ページへ、失敗時はサインインページへリダイレクトする。
export default function AuthCallbackPage() {
  const router = useRouter(); // useRouterフックを使用してルーターオブジェクトを取得

  // 認証状態の変化を監視する副作用
  useEffect(() => {
    let handled = false;

    // 認証成功時の処理
    const finishSuccess = () => {
      if (handled) {
        return;
      }

      // 認証成功時の処理を一度だけ実行するためのフラグを設定
      handled = true;
      window.clearTimeout(timeoutId);
      toast.success("ログインに成功しました。");
      router.replace(ROUTES.EVENT_LIST);
    };

    // 認証失敗時の処理
    const finishError = () => {
      if (handled) {
        return;
      }

      // 認証失敗時の処理を一度だけ実行するためのフラグを設定
      handled = true;
      window.clearTimeout(timeoutId);
      toast.error("ログインに失敗しました。もう一度お試しください。");
      router.replace(ROUTES.SIGNIN);
    };

    // Supabaseの認証状態の変化を監視する
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        finishSuccess();
      }
    });

    // 認証セッションを取得して、成功または失敗の処理を実行する
    void supabase.auth.getSession().then(({ data: { session }, error }) => {
      // 認証セッションが取得できなかった場合はエラー処理を実行
      if (error) {
        finishError();
        return;
      }

      // 認証セッションが存在する場合は成功処理を実行
      if (session) {
        finishSuccess();
      }
    });

    // 10秒後にタイムアウトとしてエラー処理を実行する
    const timeoutId = window.setTimeout(() => {
      finishError();
    }, 10000);

    // クリーンアップ関数を返すことで、コンポーネントがアンマウントされたときにタイムアウトとサブスクリプションを解除する
    return () => {
      handled = true;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [router]);

  return <p>ログイン中...</p>;
}
