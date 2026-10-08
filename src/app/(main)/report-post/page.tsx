"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuthContext } from "@/components/layouts/AuthProvider";
import { EditPreviewSwitch } from "@/components/molecules/EditPreviewSwitch";
import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { PageHeader } from "@/components/molecules/PageHeader";
import type { ReportPostFormState } from "@/components/organisms/report-post/ReportPostForm";
import { ReportPostForm } from "@/components/organisms/report-post/ReportPostForm";
import { ReportPostPreview } from "@/components/organisms/report-post/ReportPostPreview";
import { REPORT_POST_PREVIEW_SCROLL_MAPPING } from "@/components/organisms/report-post/reportPostPreviewScroll";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { useEditPreviewMode } from "@/hooks/useEditPreviewMode";
import { useObjectUrls } from "@/hooks/useObjectUrls";
import { getEventDetail } from "@/services/event";
import { createReport } from "@/services/report";
import { uploadFile } from "@/services/upload";
import type { CreateReportRequest } from "@/types/report";
import { findUploadValidationError } from "@/utils/upload";

export default function ReportPostPage() {
  // useSearchParams() を静的プリレンダリング可能にするため
  // Suspense 境界で囲む必要がある（Next.js 15 の要件）。
  return (
    <Suspense fallback={null}>
      <ReportPostPageContent />
    </Suspense>
  );
}

function ReportPostPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // リダイレクト判定に必要なのは認証状態だけなので、
  // プロフィール取得を待たない isSessionLoading を使う。
  const { isAuthenticated, isSessionLoading: isLoading } = useAuthContext();

  // フォーム状態
  const [formState, setFormState] = useState<ReportPostFormState>({
    content: "",
    reportImages: [],
    externalUrlEnabled: false,
    externalUrl: "",
    reportPdfs: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // 入力 / プレビューの表示モード。切替前後の表示位置の調整と、
  // プレビュー中の送信で入力エラーになったときの入力への切替もここで行う。
  const { mode, switchProps } = useEditPreviewMode(
    REPORT_POST_PREVIEW_SCROLL_MAPPING,
    validationErrors,
  );

  // 画像・PDF の object URL は入力中から用意しておく。プレビュー側で作ると
  // 切替後に一拍遅れて表示され、切替直後の位置合わせがその分ずれるため。
  const imageUrls = useObjectUrls(formState.reportImages);
  const pdfUrls = useObjectUrls(formState.reportPdfs);

  // 対象イベントの表示とプレビューのヘッダー表示に使うイベント情報
  const [event, setEvent] = useState<EventDetailType | null>(null);

  // イベントIDを URL パラメータから取得
  const eventId = searchParams.get("eventId");

  // 未認証の場合はサインイン画面へリダイレクト
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(ROUTES.SIGNIN);
    }
  }, [isAuthenticated, isLoading, router]);

  // イベントIDがない場合はイベントリストへリダイレクト
  useEffect(() => {
    if (!eventId) {
      toast.error("イベントが指定されていません");
      router.push(ROUTES.EVENT_LIST);
    }
  }, [eventId, router]);

  // イベント詳細取得
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    const fetchEvent = async () => {
      try {
        const data = await getEventDetail(eventId);
        if (!cancelled) {
          setEvent(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("イベント取得エラー", error);
          toast.error("イベント情報の取得に失敗しました");
        }
      }
    };
    void fetchEvent();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // バリデーション
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formState.externalUrlEnabled) {
      // 外部URLが有効な場合は、外部URLのみを検証する（contentや画像は対象外）
      const url = formState.externalUrl.trim();

      if (!url) {
        errors.externalUrl = "URLを入力してください";
      } else if (url.length > 255) {
        errors.externalUrl = "URLは255文字以内である必要があります";
      } else {
        try {
          const parsed = new URL(url);
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            errors.externalUrl =
              "http:// または https:// のURLを入力してください";
          } else if (!parsed.hostname) {
            errors.externalUrl = "正しいURL形式で入力してください";
          }
        } catch {
          errors.externalUrl = "正しいURL形式で入力してください";
        }
      }
    } else {
      // 外部URLが無効な場合は通常通りcontent・画像・PDFを検証する
      if (!formState.content.trim()) {
        errors.content = "活動記録は必須です";
      } else if (formState.content.length > 2000) {
        errors.content = "活動記録は2000文字以内である必要があります";
      }

      if (formState.reportImages.length > 10) {
        errors.reportImages = "画像は最大10枚までです";
      }

      // 画像が選択されている場合のみファイル内容のバリデーションを実施
      if (formState.reportImages.length > 0) {
        const imageValidationEntries = formState.reportImages.map((file) => ({
          file,
          kind: "image" as const,
        }));
        const imageError = findUploadValidationError(imageValidationEntries);
        if (imageError) {
          errors.reportImages = imageError;
        }
      }

      if (formState.reportPdfs.length > 0) {
        if (formState.reportPdfs.length > 3) {
          errors.reportPdfs = "PDFは最大3つまでです";
        } else {
          const pdfValidationEntries = formState.reportPdfs.map((file) => ({
            file,
            kind: "pdf" as const,
          }));
          const pdfError = findUploadValidationError(pdfValidationEntries);
          if (pdfError) {
            errors.reportPdfs = pdfError;
          }
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // フォーム送信処理
  const handleSubmit = async () => {
    if (!validateForm() || !eventId) {
      return;
    }

    setIsSubmitting(true);

    try {
      const imageObjectKeys: string[] = [];
      const imageFilenames: string[] = [];
      const pdfObjectKeys: string[] = [];
      const pdfFilenames: string[] = [];

      // 外部URLが無効な場合のみ、画像・PDFをアップロード
      if (!formState.externalUrlEnabled) {
        for (const image of formState.reportImages) {
          const { objectKey, filename } = await uploadFile(image, "image");
          imageObjectKeys.push(objectKey);
          imageFilenames.push(filename);
        }

        for (const pdfFile of formState.reportPdfs) {
          const { objectKey, filename } = await uploadFile(pdfFile, "pdf");
          pdfObjectKeys.push(objectKey);
          pdfFilenames.push(filename);
        }
      }

      // レポート作成リクエストを組み立て
      const trimmedExternalUrl = formState.externalUrl.trim();
      const payload: CreateReportRequest = {
        eventId,
        // バックエンドは content が必須のため、外部URL時は固定文言を送って契約を満たす。
        // 外部URLレポートは詳細画面で本文を表示しないため、見た目への影響はない。
        content: formState.externalUrlEnabled
          ? "外部サイトでレポートを公開しています。"
          : formState.content.trim(),
        ...(formState.externalUrlEnabled &&
          trimmedExternalUrl && {
            externalUrls: [trimmedExternalUrl],
          }),
        ...(imageObjectKeys.length > 0 && { imageObjectKeys, imageFilenames }),
        ...(pdfObjectKeys.length > 0 && { pdfObjectKeys, pdfFilenames }),
      };

      // レポート作成 API を呼び出し
      const _response = await createReport(payload);

      toast.success("レポートを投稿しました");
      router.push(`/event/${encodeURIComponent(eventId)}`);
    } catch (error) {
      console.error("レポート投稿エラー:", error);
      toast.error(
        error instanceof Error ? error.message : "レポート投稿に失敗しました",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const startDate = event?.eventDate ? new Date(event.eventDate) : null;
  const endDate = event?.endDate ? new Date(event.endDate) : null;

  const startDateLabel = startDate?.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });

  const startTimeLabel = startDate?.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

  const endDateLabel = endDate?.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });

  const endTimeLabel = endDate?.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

  const isSameDay =
    startDate &&
    endDate &&
    startDate.toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
    }) ===
      endDate.toLocaleDateString("ja-JP", {
        timeZone: "Asia/Tokyo",
      });

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="w-full space-y-5 sm:space-y-6">
      {/* ページヘッダー */}
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          title="活動レポートを投稿"
          backHref={
            eventId
              ? `/event/${encodeURIComponent(eventId)}`
              : ROUTES.EVENT_LIST
          }
          backLabel="イベント詳細にもどる"
        />
      </div>

      {/* 入力/プレビュー切替。イベント投稿画面と同じ部品で、位置・見た目・動作を揃える。 */}
      <EditPreviewSwitch {...switchProps} />

      <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
        {/* イベント情報表示 */}
        {event && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="px-4 sm:px-5">
              <p className="text-sm font-semibold text-blue-600">
                対象イベント
              </p>

              <h2 className="break-words text-base font-bold text-slate-900 sm:text-lg">
                {event.title}
              </h2>

              <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-0">
                {event.eventDate && event.endDate && (
                  <span>
                    {startDateLabel} {startTimeLabel}〜
                    {isSameDay
                      ? endTimeLabel
                      : `${endDateLabel} ${endTimeLabel}`}
                  </span>
                )}

                {event.location && (
                  <span className="min-w-0 break-words">
                    {event.eventDate && event.endDate ? (
                      <span className="mx-2 hidden sm:inline">｜</span>
                    ) : null}
                    {event.location}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* メインコンテンツ。入力フォームはプレビュー中も外さずに隠し、入力途中の状態と高さを保つ。
            外すと戻ったときに作り直され、添付ファイル一覧などが後から出て位置がずれる。 */}
        <ReportPostForm
          formState={formState}
          validationErrors={validationErrors}
          setFormState={setFormState}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isSubmitting={isSubmitting}
          hidden={mode !== "edit"}
        />
        {mode === "preview" ? (
          <ReportPostPreview
            formState={formState}
            event={event}
            imageUrls={imageUrls}
            pdfUrls={pdfUrls}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isSubmitting={isSubmitting}
          />
        ) : null}
      </div>
    </section>
  );
}
