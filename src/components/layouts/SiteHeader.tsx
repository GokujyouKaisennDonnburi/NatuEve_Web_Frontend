"use client";

import {
  useAuthContext,
  useCurrentUserContext,
} from "@/components/layouts/AuthProvider";
import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { Menu, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
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

const HEADER_NAV_ITEMS = [
  { href: ROUTES.EVENT_LIST, label: "イベントを探す" },
  { href: ROUTES.COMING_SOON, label: "主催者の方へ" },
  { href: ROUTES.ABOUT, label: "なちゅいべとは" },
] as const;

export function SiteHeader() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuTriggerRef = useRef<HTMLDivElement>(null);
  const mobileMenuPanelRef = useRef<HTMLElement>(null);

  // 認証状態と現在のユーザー情報を Provider から取得。
  // 表示名とアイコンを出すため、プロフィールの確定まで待つ isUserLoading を使う。
  const { session } = useAuthContext();
  const { user: currentUser, isUserLoading: isLoading } =
    useCurrentUserContext();

  // ヘッダ表示用ユーザー情報を生成する。
  // /api/v1/me が失敗した場合は、セッション（Google の user_metadata 由来）の
  // 名前とアイコンで代替する。ここで null にしてしまうと、サインイン済みなのに
  // 「サインイン」ボタンが出て、イベント投稿にも進めなくなるため。
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

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const closeMobileMenu = (event: PointerEvent) => {
      const target = event.target as Node;
      const isTriggerClicked = mobileMenuTriggerRef.current?.contains(target);
      const isPanelClicked = mobileMenuPanelRef.current?.contains(target);

      if (!isTriggerClicked && !isPanelClicked) {
        setIsMobileMenuOpen(false);
      }
    };
    const closeMobileMenuByEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeMobileMenu);
    document.addEventListener("keydown", closeMobileMenuByEscape);

    return () => {
      document.removeEventListener("pointerdown", closeMobileMenu);
      document.removeEventListener("keydown", closeMobileMenuByEscape);
    };
  }, [isMobileMenuOpen]);

  // サインイン状態を確認してイベント投稿ページへ遷移する
  const handleCreateEvent = () => {
    if (isLoading) {
      return;
    }
    if (!user?.id) {
      toast.error("イベントを投稿するにはサインインしてください。");
      return;
    }
    router.push(ROUTES.EVENT_POST);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white">
      <div className="relative mx-auto grid min-h-14 w-full max-w-[1440px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-2 px-4 py-2 sm:flex sm:h-14 sm:min-h-0 sm:gap-2 sm:px-6 sm:py-0 lg:px-8 2xl:px-10">
        {/* ロゴとサイト名 */}
        <Link
          href={ROUTES.EVENT_LIST}
          aria-label="イベント一覧へ"
          className="flex min-w-0 items-center gap-0.5 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <div className="relative h-10 w-10 shrink-0 sm:h-12 sm:w-12">
            <Image
              src="/images/NatuEve_logo.png"
              alt=""
              fill
              sizes="(max-width: 639px) 40px, 48px"
              priority
              className="object-contain"
            />
          </div>
          <div className="flex min-w-0 flex-col items-start gap-0 sm:flex-row sm:items-end sm:gap-2">
            <span className="whitespace-nowrap text-base font-bold tracking-tight text-emerald-700 sm:text-lg">
              なちゅいべ
            </span>
            <span className="whitespace-nowrap text-[10px] text-slate-500">
              by NatuPortal
            </span>
          </div>
        </Link>

        {/* デスクトップナビゲーション */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 lg:flex">
          {HEADER_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-[#F2F7E8] hover:text-[#315E26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* lg未満では非表示の主要ナビゲーションをメニューから利用できる。 */}
        <div
          ref={mobileMenuTriggerRef}
          className="col-start-3 row-start-1 flex items-center sm:col-auto sm:row-auto sm:ml-auto lg:hidden"
        >
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-controls="mobile-site-navigation"
            aria-expanded={isMobileMenuOpen}
            aria-label={
              isMobileMenuOpen ? "メニューを閉じる" : "メニューを開く"
            }
            onClick={() => {
              setIsMobileMenuOpen((isOpen) => !isOpen);
            }}
            className="rounded-full border-slate-200 text-slate-700 transition-colors hover:border-[#9ABD5A]/60 hover:bg-[#F2F7E8] hover:text-[#315E26] aria-expanded:border-[#9ABD5A]/60 aria-expanded:bg-[#F2F7E8]"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* 投稿導線。サインアウト時は強調表示を外し、文言のみ残す。 */}
        {!isLoading && (
          <div className="hidden justify-end lg:ml-auto lg:flex">
            {user?.id ? (
              <CreateEventButton
                type="button"
                onClick={handleCreateEvent}
                aria-label="イベントを投稿"
              >
                イベントを投稿
              </CreateEventButton>
            ) : (
              <button
                type="button"
                onClick={handleCreateEvent}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-[#F2F7E8] hover:text-[#315E26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                イベントを投稿
              </button>
            )}
          </div>
        )}

        {/* 認証UI。サインイン後は投稿ボタンの右側にアイコンを表示する。 */}
        <div
          className={cn(
            "hidden shrink-0 items-center justify-end lg:flex",
            isLoading && "lg:ml-auto",
          )}
        >
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse border border-slate-300/50" />
          ) : !user ? (
            <Button
              asChild
              variant="outline"
              className="cursor-pointer rounded-full px-5 text-sm font-medium text-slate-700 transition-colors hover:border-[#9ABD5A]/60 hover:bg-[#F2F7E8] hover:text-[#315E26]"
            >
              <Link href={ROUTES.SIGNIN}>サインイン</Link>
            </Button>
          ) : user.id ? (
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              className="rounded-full p-0 transition-shadow hover:ring-2 hover:ring-[#9ABD5A]/60 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <Link href={ROUTES.MYPAGE} aria-label="マイページへ">
                <GlobalUserAvatar
                  name={user.name}
                  iconUrl={user.avatarUrl}
                  className="transition-opacity"
                />
              </Link>
            </Button>
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

        {isMobileMenuOpen && (
          <nav
            ref={mobileMenuPanelRef}
            id="mobile-site-navigation"
            aria-label="主要ナビゲーション"
            className="absolute left-0 top-full flex w-full flex-col border-b border-slate-200 bg-white px-4 py-3 shadow-md lg:hidden"
          >
            {HEADER_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-[#F2F7E8] hover:text-[#315E26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-2 border-t border-slate-200 pt-2">
              {!isLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleCreateEvent();
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#F2F7E8] hover:text-[#315E26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {user?.id && (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#9ABD5A] text-[#173315]">
                      <Plus
                        className="size-5"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </span>
                  )}
                  イベントを投稿
                </button>
              )}

              {!isLoading && user?.id ? (
                <Link
                  href={ROUTES.MYPAGE}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-[#F2F7E8] hover:text-[#315E26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <GlobalUserAvatar
                    name={user.name}
                    iconUrl={user.avatarUrl}
                    className="border-[#9ABD5A]/60 shadow-none"
                  />
                  マイページへ
                </Link>
              ) : !isLoading ? (
                <Link
                  href={ROUTES.SIGNIN}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-[#F2F7E8] hover:text-[#315E26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  サインイン
                </Link>
              ) : null}
            </div>
          </nav>
        )}
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
