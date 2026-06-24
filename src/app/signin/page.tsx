"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInWithGoogle } from "@/services/auth";
import { signinStyles } from "./signinStyles";

/**
 * Googleサインインのみのシンプルなサインイン画面。
 *
 * - Google OAuth は Supabase を通じて実装されています。
 * - クリックすると Google 認証画面へリダイレクトします。
 */

export default function SignInPage() {
  const appName = "Google";

  // Googleサインインボタンのクリックハンドラ
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle(); // サインイン処理を呼び出す
    } catch (error) {
      console.error("Google sign-in failed", error);
      toast.error("サインインに失敗しました。もう一度お試しください。");
    }
  };

  return (
    <div className={signinStyles.page}>
      <Card className={signinStyles.card}>
        <CardHeader className={signinStyles.cardHeader}>
          <CardTitle className={signinStyles.title}>なちゅぽ～たる</CardTitle>
          <CardDescription className={signinStyles.description}>
            続行するには{appName}にサインインしてください
          </CardDescription>
        </CardHeader>

        <CardContent className={signinStyles.content}>
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            variant="outline"
            className={signinStyles.button}
          >
            <GoogleLogo />
            Googleでサインイン
          </Button>

          <p className={signinStyles.legalText}>
            続行することで、
            <span className={signinStyles.legalLink} aria-disabled="true">
              利用規約
            </span>
            と
            <span className={signinStyles.legalLink} aria-disabled="true">
              プライバシーポリシー
            </span>
            に同意したことになります。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/** Google公式カラーのロゴ（インラインSVG） */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.36 0-4.36-1.6-5.08-3.74H.92v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.92 10.68A5.4 5.4 0 0 1 3.64 9c0-.58.1-1.15.28-1.68V4.99H.92A9 9 0 0 0 0 9c0 1.45.35 2.83.92 4.01l3-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .92 4.99l3 2.33C4.64 5.18 6.64 3.58 9 3.58z"
      />
    </svg>
  );
}
