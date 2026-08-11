"use client";

import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PillButton } from "@/components/atoms/PillButton";
import { SegmentControl } from "@/components/atoms/SegmentControl";
import {
  EVENT_DETAIL_ATTACHMENTS_SECTION_ID,
  EVENT_DETAIL_TOC_SECTIONS,
} from "@/components/molecules/event-detail/eventDetailTocSections";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PageToc } from "@/components/molecules/PageToc";
import { EventPostForm } from "@/components/organisms/event-post/EventPostForm";
import { EventPostPreview } from "@/components/organisms/event-post/EventPostPreview";
import { EVENT_POST_TOC_SECTIONS } from "@/components/organisms/event-post/eventPostTocSections";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/components/layouts/AuthProvider";
import { useEventPostForm } from "@/hooks/useEventPostForm";

type PostMode = "edit" | "preview";

// イベント投稿ページ。認証ガードと画面の骨組みを持ち、
// 入力/プレビューの切り替えとフォーム状態の共有を行う。
export default function EventPostPage() {
  const router = useRouter();
  // リダイレクト判定に必要なのは認証状態だけなので、
  // プロフィール取得を待たない isSessionLoading を使う。
  const { isSessionLoading: isAuthLoading, isAuthenticated } = useAuthContext();
  const { formState, errors, isSubmitting, setField, handleSubmit } =
    useEventPostForm();

  const [mode, setMode] = useState<PostMode>("edit");

  // 認証状態がロードされ、かつ未認証の場合はサインインページにリダイレクト
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace(ROUTES.SIGNIN);
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const hasPdf = formState.eventDocuments.length > 0;

  const tocSections = useMemo(() => {
    if (mode === "preview") {
      return EVENT_DETAIL_TOC_SECTIONS.filter(
        (section) =>
          section.id !== EVENT_DETAIL_ATTACHMENTS_SECTION_ID || hasPdf,
      );
    }
    return EVENT_POST_TOC_SECTIONS;
  }, [mode, hasPdf]);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="イベントを投稿"
        backHref={ROUTES.EVENT_LIST}
        backLabel="イベント一覧にもどる"
        right={
          <SegmentControl
            value={mode}
            onChange={setMode}
            aria-label="入力とプレビューの切り替え"
            options={[
              { value: "edit", label: "入力" },
              { value: "preview", label: "プレビュー", icon: Eye },
            ]}
          />
        }
      />
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="flex flex-col gap-8 lg:flex-row">
          {mode === "edit" ? (
            <aside className="hidden shrink-0 lg:block lg:w-44">
              <PageToc sections={tocSections} />
            </aside>
          ) : null}
          <div
            className={cn(
              "w-full",
              mode === "edit" ? "max-w-3xl" : "min-w-0 flex-1",
            )}
          >
            {mode === "edit" ? (
              <EventPostForm
                formState={formState}
                errors={errors}
                setField={setField}
              />
            ) : (
              <EventPostPreview formState={formState} />
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <PillButton
            tone="outline"
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            キャンセル
          </PillButton>
          <PillButton tone="brand" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "送信中…" : "イベントを投稿"}
          </PillButton>
        </div>
      </form>
    </section>
  );
}
