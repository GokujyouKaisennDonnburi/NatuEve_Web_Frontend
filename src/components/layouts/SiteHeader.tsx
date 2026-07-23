"use client";

import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// UI表示に必要な最小限のユーザー情報
type HeaderUser = {
  id?: string;
  name: string;
  avatarUrl: string;
};

// /api/v1/me のレスポンス型（snake_case / camelCase 両対応）
type MeApiResponse = {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  displayName?: string;
  avatarUrl?: string;
};

export function SiteHeader() {
  // 認証状態の取得
  const { session, isLoading: isSessionLoading } = useAuth();

  // ユーザー情報の状態管理
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // session に応じて /api/v1/me を取得（未ログイン・401 は null 扱い）
  useEffect(() => {
    let cancelled = false;

    // session がロード中の場合は何もしない
    const fetchMe = async () => {
      if (isSessionLoading) return;

      // 未ログインの場合は null をセットして終了
      if (!session?.token) {
        if (!cancelled) {
          setUser(null);
          setIsProfileLoading(false);
        }
        return;
      }

      // ログイン済みで、かつセッションが有効な場合にプロフィールを取得
      if (!cancelled) {
        setIsProfileLoading(true);
      }

      // /api/v1/me からユーザー情報を取得
      try {
        // 認証ヘッダーを付与して /api/v1/me を呼び出す
        const res = await fetch("/api/v1/me", {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });

        // 401 Unauthorized の場合はユーザー情報を null にセットして終了
        if (res.status === 401) {
          if (!cancelled) setUser(null);
          return;
        }

        // それ以外のエラーの場合は例外を投げる
        if (!res.ok) {
          throw new Error(`プロフィール取得エラー (Status: ${res.status})`);
        }

        // レスポンスを JSON としてパースし、ユーザー情報をセット
        const data = (await res.json()) as MeApiResponse;
        if (!cancelled) {
          setUser({
            id: data.id,
            name: data.displayName ?? data.display_name ?? "ユーザー",
            avatarUrl: data.avatarUrl ?? data.avatar_url ?? "",
          });
        }
      } catch (err) {
        console.error("Me取得エラー:", err);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsProfileLoading(false);
      }
    };

    // 非同期関数を呼び出す
    void fetchMe();
    return () => {
      cancelled = true;
    };
  }, [session, isSessionLoading]);

  // 認証状態またはプロフィール取得中の場合はローディング状態とする
  const isLoading = isSessionLoading || isProfileLoading;

  return (
    <header className="w-full border-b border-slate-200/80 bg-white">
      <div className="relative mx-auto flex h-14 w-full max-w-6xl items-center px-8 lg:px-10">
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

        {/* 認証UI */}
        <div className="ml-auto flex items-center shrink-0">
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
