"use client";

import { CreateEventButton } from "@/components/atoms/CreateEventButton";
import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// UI表示に必要な最小限のユーザー情報
type HeaderUser = {
  id?: string;
  name: string;
  avatarUrl: string;
};

export function SiteHeader() {
  const router = useRouter();

  // 認証状態の取得
  const { session, isLoading: isSessionLoading } = useAuth();

  // 現在のユーザー情報を取得（Service経由）
  const { user: currentUser, isLoading: isProfileLoading } =
    useCurrentUser(session);

  // session に応じてヘッダ表示用ユーザー情報を生成
  const user: HeaderUser | null = currentUser
    ? {
        id: currentUser.id,
        name: currentUser.displayName || "ユーザー",
        avatarUrl: currentUser.avatarUrl,
      }
    : null;

  // 認証状態またはプロフィール取得中の場合はローディング状態とする
  const isLoading = isSessionLoading || isProfileLoading;

  // ログイン状態を確認してイベント投稿ページへ遷移する
  const handleCreateEvent = () => {
    if (isLoading) {
      return;
    }
    if (!user?.id) {
      toast.error("イベントを投稿するにはログインしてください。");
      return;
    }
    router.push(ROUTES.EVENT_POST);
  };

  return (
    <header className="w-full border-b border-slate-200/80 bg-white">
      <div className="relative mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:px-8 lg:px-10">
        {/* ロゴとサイト名 */}
        <div className="flex items-center gap-0.5">
          <div className="relative h-12 w-12 shrink-0">
            <Image
              src="/images/NatuEve_logo.png"
              alt=""
              fill
              sizes="40px"
              priority
              className="object-contain"
            />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-lg font-bold tracking-tight text-emerald-700">
              なちゅいべ
            </span>
            <span className="text-[10px] text-slate-500">by NatuPortal</span>
          </div>
        </div>

        {/* ナビゲーション（md以上で表示） */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 md:flex items-center gap-10">
          <Link
            href={ROUTES.EVENT_LIST}
            className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            イベントを探す
          </Link>
          <Link
            href={ROUTES.COMING_SOON}
            className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            主催者の方へ
          </Link>
          <Link
            href={ROUTES.COMING_SOON}
            className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            なちゅいべとは
          </Link>
        </nav>

        {/* 投稿導線と認証UI */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <CreateEventButton
            type="button"
            onClick={handleCreateEvent}
            disabled={isLoading}
            aria-label="イベントを投稿"
          >
            イベントを投稿
          </CreateEventButton>
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse border border-slate-300/50" />
          ) : !user ? (
            <Button
              asChild
              variant="outline"
              className="rounded-full px-5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
            >
              <Link href={ROUTES.SIGNIN}>ログイン</Link>
            </Button>
          ) : user.id ? (
            <Link
              href={ROUTES.MYPAGE}
              className="block shrink-0 rounded-full hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <GlobalUserAvatar
                name={user.name}
                iconUrl={user.avatarUrl}
                className="transition-opacity"
              />
            </Link>
          ) : (
            <div className="block shrink-0 rounded-full">
              <GlobalUserAvatar
                name={user.name}
                iconUrl={user.avatarUrl}
                className="transition-opacity"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
