"use client";

import { CreateEventButton } from "@/components/atoms/CreateEventButton";
import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";

// UI表示に必要な最小限のユーザー情報を定義
export type HeaderUser = {
  id?: string;
  name: string;
  avatarUrl: string;
};

// ヘッダーが受け取るProps（引数）を定義
type TimelineHeaderProps = {
  eventCount: number;
  isUserLoading: boolean;
  onCreateEvent: () => void;
  user: HeaderUser | null;
};

export function TimelineHeader({
  eventCount,
  isUserLoading,
  onCreateEvent,
  user,
}: TimelineHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
        <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
          <span className="text-xl">🌿</span> 生き物イベントタイムライン
        </h1>

        {/* 件数表示とサインイン関連UIをまとめるコンテナ */}
        <div className="flex items-center gap-3">
          {/* 件数表示 */}
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {eventCount} 件のイベント
          </span>

          {/* イベント投稿ボタン */}
          <CreateEventButton
            type="button"
            onClick={onCreateEvent}
            aria-label="イベントを投稿"
          ></CreateEventButton>

          {/* サインイン状態（userオブジェクトの有無）に応じた表示切り替え */}
          {isUserLoading ? (
            // ユーザー情報取得中：ふわふわアニメーションするグレーの丸型プレースホルダー
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0 border border-slate-300/50" />
          ) : !user ? (
            // 未サインイン状態：登録・サインインボタン
            <Button
              asChild
              size="sm"
              className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-md transition-colors shrink-0 border-none cursor-pointer shadow-none"
            >
              <Link href={ROUTES.SIGNIN}>新規登録・サインイン</Link>
            </Button>
          ) : (
            // サインイン済み状態：ユーザーアイコン
            // userから直接名前とアイコン画像を展開
            user.id ? (
              <Link
                href={`/users/${user.id}`}
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
            )
          )}
        </div>
      </div>
    </header>
  );
}
