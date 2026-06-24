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

    const exchangeSession = async () => {
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          throw error;
        }
      }
    };

    // 認証成功時の処理
    const finishSuccess = () => {
      if (handled) {
        return;
      }

      // 認証成功時の処理を一度だけ実行するためのフラグを設定
      handled = true;
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

    // PKCE の code をセッションへ交換し、その後に成功/失敗を判定する
    void exchangeSession()
      .then(() => supabase.auth.getSession())
      .then(({ data: { session }, error }) => {
        if (error) {
          finishError();
          return;
        }

        if (session) {
          finishSuccess();
          return;
        }

        finishError();
      })
      .catch(() => {
        finishError();
      });

    // クリーンアップ関数を返すことで、コンポーネントがアンマウントされたときにタイムアウトとサブスクリプションを解除する
    return () => {
      handled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  return <p>ログイン中...</p>;
}
