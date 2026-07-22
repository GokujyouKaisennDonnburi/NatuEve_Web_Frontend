import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import Image from "next/image";
import Link from "next/link";

// UI表示に必要な最小限のユーザー情報を定義
type HeaderUser = {
  id?: string;
  name: string;
  avatarUrl: string;
};

// ヘッダーが受け取るProps（引数）を定義
type SiteHeaderProps = {
  user: HeaderUser | null;
  isLoading: boolean;
};

export function SiteHeader({ user, isLoading }: SiteHeaderProps) {
  return (
    <header className="w-full border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* ロゴとブランド */}
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-md"
        >
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src="/images/NatuEve_logo.png"
              alt=""
              fill
              sizes="32px"
              priority
              className="object-contain"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              なちゅいべ
            </span>
            <span className="text-[10px] text-slate-500">by NatuPortal</span>
          </div>
        </Link>

        {/* ナビゲーション（md以上で表示） */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href={ROUTES.EVENT_LIST}
            className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            イベントを探す
          </Link>
          <span
            className="text-sm font-medium text-slate-400 cursor-default"
            aria-disabled="true"
          >
            主催者の方へ
          </span>
          <span
            className="text-sm font-medium text-slate-400 cursor-default"
            aria-disabled="true"
          >
            なちゅいべとは
          </span>
        </nav>

        {/* 認証UI */}
        <div className="flex items-center shrink-0">
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
