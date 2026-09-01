"use client";

import { Eye } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

import { SegmentControl } from "@/components/atoms/SegmentControl";
import { useAuthContext } from "@/components/layouts/AuthProvider";
import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { PageHeader } from "@/components/molecules/PageHeader";
import type { ReportPostFormState } from "@/components/organisms/report-post/ReportPostForm";
import { ReportPostForm } from "@/components/organisms/report-post/ReportPostForm";
import { ReportPostPreview } from "@/components/organisms/report-post/ReportPostPreview";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
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

  // 入力 / プレビューの表示モード
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  // プレビューのヘッダー表示に使うイベント情報
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

  // プレビュー表示用にイベント詳細を取得する（取得失敗時はエラーを無視して表示のみ続行）。
  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    getEventDetail(eventId)
      .then((data) => {
        if (!cancelled) setEvent(data);
      })
      .catch((err) => {
        console.error("イベント詳細取得エラー", err);
      });

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
  const _handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    <section className="mx-auto w-full max-w-5xl space-y-6">
      {/* ページヘッダー */}
      <PageHeader
        title="活動レポートを投稿"
        backHref={
          eventId ? `/event/${encodeURIComponent(eventId)}` : ROUTES.EVENT_LIST
        }
        backLabel="イベント詳細にもどる"
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

      {/* イベント情報表示 */}
      {event && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="px-5">
            <p className="text-sm font-semibold text-blue-600">対象イベント</p>

            <h2 className="text-lg font-bold text-slate-900">{event.title}</h2>

            <div className="mt-2 text-sm text-slate-600">
              {event.eventDate && event.endDate && (
                <span>
                  {startDateLabel} {startTimeLabel}〜
                  {isSameDay ? endTimeLabel : `${endDateLabel} ${endTimeLabel}`}
                </span>
              )}

              {event.location && (
                <>
                  <span className="mx-2">｜</span>
                  <span>{event.location}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* メインコンテンツ */}
      {mode === "edit" ? (
        <ReportPostForm
          formState={formState}
          validationErrors={validationErrors}
          setFormState={setFormState}
          onSubmit={_handleSubmit}
          onCancel={() => router.back()}
          isSubmitting={isSubmitting}
        />
      ) : (
        <ReportPostPreview
          formState={formState}
          event={event}
          onSubmit={_handleSubmit}
          onCancel={() => router.back()}
          isSubmitting={isSubmitting} />
      )}
    </section>
  );
}
