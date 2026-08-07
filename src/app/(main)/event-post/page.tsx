"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { PageHeader } from "@/components/molecules/PageHeader";
import { PageToc } from "@/components/molecules/PageToc";
import { EventPostForm } from "@/components/organisms/event-post/EventPostForm";
import { EVENT_POST_TOC_SECTIONS } from "@/components/organisms/event-post/eventPostTocSections";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";

// イベント投稿ページ。認証ガードと画面の骨組みだけを持ち、
// 入力フォームの実装は organisms/event-post/EventPostForm に委ねる。
export default function EventPostPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();

  // 認証状態がロードされ、かつ未認証の場合はサインインページにリダイレクト
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace(ROUTES.SIGNIN);
    }
  }, [isAuthLoading, isAuthenticated, router]);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="イベントを投稿"
        backHref={ROUTES.EVENT_LIST}
        backLabel="イベント一覧にもどる"
      />
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden shrink-0 lg:block lg:w-44">
          <PageToc sections={EVENT_POST_TOC_SECTIONS} />
        </aside>
        <div className="w-full max-w-3xl">
          <EventPostForm />
        </div>
      </div>
    </section>
  );
}
