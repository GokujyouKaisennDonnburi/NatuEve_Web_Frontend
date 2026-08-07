"use client";

import {
  useAuthContext,
  useCurrentUserContext,
} from "@/components/layouts/AuthProvider";
import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { toast } from "sonner";

// UI表示に必要な最小限のユーザー情報
type HeaderUser = {
  id?: string;
  name: string;
  avatarUrl: string;
};

// イベント投稿ページへの導線ボタンコンポーネントのprops型
type CreateEventButtonProps = ComponentPropsWithoutRef<typeof Button> & {
  children?: ReactNode;
};

export function SiteHeader() {
  const router = useRouter();

  // 認証状態と現在のユーザー情報を Provider から取得。
  // 表示名とアイコンを出すため、プロフィールの確定まで待つ isUserLoading を使う。
  const { session } = useAuthContext();
  const { user: currentUser, isUserLoading: isLoading } =
    useCurrentUserContext();

  // ヘッダ表示用ユーザー情報を生成する。
  // /api/v1/me が失敗した場合は、セッション（Google の user_metadata 由来）の
  // 名前とアイコンで代替する。ここで null にしてしまうと、ログイン済みなのに
  // 「ログイン」ボタンが出て、イベント投稿にも進めなくなるため。
  // 表示名をアプリ側で編集していた場合は API 復旧まで Google の名前が出るが、
  // アイコンは同じ値（DB の avatar_url も JWT 由来）なので見た目は変わらない。
  const user: HeaderUser | null = currentUser
    ? {
        id: currentUser.id,
        name: currentUser.displayName || "ユーザー",
        avatarUrl: currentUser.avatarUrl,
      }
    : session
      ? {
          id: session.userId,
          name: session.name || "ユーザー",
          avatarUrl: session.iconUrl ?? "",
        }
      : null;

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

// イベント投稿ページへの導線ボタンのコンポーネント（用途が増えた場合、関数名などは適宜変更）
export function CreateEventButton({
  className,
  children = "投稿",
  ...props
}: Readonly<CreateEventButtonProps>) {
  return (
    <Button
      {...props}
      className={cn(
        "h-7 rounded-full border-2 border-transparent bg-[#9ABD5A] px-5 text-sm font-bold text-[#173315] shadow-sm transition-colors hover:border-[#173315] hover:bg-[#A5C869] hover:text-[#173315] py-0",
        className,
      )}
    >
      <Plus className="size-5" strokeWidth={2} />
      <span>{children}</span>
    </Button>
  );
}
