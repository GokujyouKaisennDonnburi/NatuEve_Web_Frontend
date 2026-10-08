"use client";

import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { PillButton } from "@/components/atoms/PillButton";
import { SegmentControl } from "@/components/atoms/SegmentControl";
import { useAuthContext } from "@/components/layouts/AuthProvider";
import {
  EVENT_DETAIL_ATTACHMENTS_SECTION_ID,
  EVENT_DETAIL_TOC_SECTIONS,
} from "@/components/molecules/event-detail/eventDetailTocSections";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PageToc } from "@/components/molecules/PageToc";
import { EventPostForm } from "@/components/organisms/event-post/EventPostForm";
import { EventPostPreview } from "@/components/organisms/event-post/EventPostPreview";
import { EVENT_POST_PREVIEW_SCROLL_MAPPING } from "@/components/organisms/event-post/eventPostPreviewScroll";
import { EVENT_POST_TOC_SECTIONS } from "@/components/organisms/event-post/eventPostTocSections";
import { ROUTES } from "@/constants/routes";
import { useEditPreviewMode } from "@/hooks/useEditPreviewMode";
import { useEventPostForm } from "@/hooks/useEventPostForm";
import { useObjectUrls } from "@/hooks/useObjectUrls";
import { cn } from "@/lib/utils";
import { preventImplicitSubmit } from "@/utils/form";

// イベント投稿ページ。認証ガードと画面の骨組みを持ち、
// 入力/プレビューの切り替えとフォーム状態の共有を行う。
export default function EventPostPage() {
  const router = useRouter();
  // リダイレクト判定に必要なのは認証状態だけなので、
  // プロフィール取得を待たない isSessionLoading を使う。
  const { isSessionLoading: isAuthLoading, isAuthenticated } = useAuthContext();
  const { formState, errors, isSubmitting, setField, handleSubmit } =
    useEventPostForm();

  const { mode, changeMode, switchCaptureHandlers } = useEditPreviewMode(
    EVENT_POST_PREVIEW_SCROLL_MAPPING,
    errors,
  );

  // 画像・PDF の object URL は入力中から用意しておく。プレビュー側で作ると
  // 切替後に一拍遅れて表示され、切替直後の位置合わせがその分ずれるため。
  const imageFiles = useMemo(
    () => (formState.eventImage ? [formState.eventImage] : []),
    [formState.eventImage],
  );
  const imageUrls = useObjectUrls(imageFiles);
  const pdfUrls = useObjectUrls(formState.eventDocuments);

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

  // 入力/プレビュー切替は main の内容幅の右端へ寄せるため、この section は
  // max-w を持たず全幅とし、見出しとフォームだけ中央寄せコンテナに載せる。
  return (
    <section className="w-full space-y-6">
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          title="イベントを投稿"
          backHref={ROUTES.EVENT_LIST}
          backLabel="イベント一覧にもどる"
        />
      </div>
      {/* 入力/プレビュー切替。スクロール中も画面右上に固定で表示する。
          フル画面時にフォーム項目の右上へ重ならないよう、
          max-w-5xl の右端ではなく画面（main の内容幅）の右端へ寄せる。
          ラッパーを全幅にすると固定中の帯が下の入力欄や目次のクリックを妨げるため、
          w-fit + ml-auto でピルの幅だけに縮める。 */}
      <div
        className="sticky top-20 z-30 ml-auto w-fit"
        {...switchCaptureHandlers}
      >
        <SegmentControl
          value={mode}
          onChange={changeMode}
          aria-label="入力とプレビューの切り替え"
          options={[
            { value: "edit", label: "入力" },
            { value: "preview", label: "プレビュー", icon: Eye },
          ]}
        />
      </div>
      <div className="mx-auto w-full max-w-5xl">
        <form
          onSubmit={handleSubmit}
          onKeyDown={preventImplicitSubmit}
          noValidate
          className="space-y-4"
        >
          <div className="flex flex-col gap-8 lg:flex-row">
            {mode === "edit" ? (
              <aside className="hidden shrink-0 lg:block lg:w-44">
                <PageToc sections={tocSections} />
              </aside>
            ) : null}
            {/* 操作ボタンは入力項目と同じ列に置き、項目の下に揃えて表示する */}
            <div
              className={cn(
                "w-full space-y-4",
                mode === "edit" ? "max-w-3xl" : "min-w-0 flex-1",
              )}
            >
              {/* 入力フォームはプレビュー中も外さずに隠し、入力途中の状態と高さを保つ。
                  外すと戻ったときに作り直され、添付ファイル一覧などが後から出て位置がずれる。 */}
              <EventPostForm
                formState={formState}
                errors={errors}
                setField={setField}
                hidden={mode !== "edit"}
              />
              {mode === "preview" ? (
                <EventPostPreview
                  formState={formState}
                  imageUrls={imageUrls}
                  pdfUrls={pdfUrls}
                />
              ) : null}
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
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
