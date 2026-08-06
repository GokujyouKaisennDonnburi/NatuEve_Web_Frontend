"use client";

import { FieldNote } from "@/components/atoms/event-post/FieldNote";

import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { OptionalUrlField } from "@/components/molecules/event-post/OptionalUrlField";
import {
  MultiFileField,
  type FileWithId,
} from "@/components/molecules/report-post/MultiFileField";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { getEventDetail } from "@/services/event";
import { createReport } from "@/services/report";
import { uploadFile } from "@/services/upload";
import type { CreateReportRequest } from "@/types/report";
import { findUploadValidationError } from "@/utils/upload";
import { FileText, Image as ImageIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

// レポート投稿フォームの入力状態を管理する型定義
type ReportPostFormState = {
  content: string; // 活動記録の文章
  reportImages: FileWithId[]; // 活動している様子の画像の配列
  externalUrlEnabled: boolean; // 外部URLの有効化状態
  externalUrl: string; // 外部URL
  reportPdfs: FileWithId[]; // レポート PDF ファイルの配列
};

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
  const { isAuthenticated, isLoading } = useAuth();

  // フォーム状態
  const [formState, setFormState] = useState<ReportPostFormState>({
    content: "",
    reportImages: [],
    externalUrlEnabled: false,
    externalUrl: "",
    reportPdfs: [],
  });

  const [event, setEvent] = useState<EventDetailType | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

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
        setEvent(data);
      } catch (error) {
        console.error("イベント取得エラー", error);
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
  const handleSubmit = async (e: React.FormEvent) => {
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
        ...(!formState.externalUrlEnabled &&
          formState.content.trim() && { content: formState.content.trim() }),
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

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* ページヘッダー */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          活動レポートを投稿
        </h1>
        <p className="text-base text-slate-600">
          イベント参加時の活動内容を記録しましょう
        </p>
      </div>

      {/* イベント情報表示 */}
      {event && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="px-5">
            <p className="text-sm font-semibold text-blue-600">
              対象イベント
            </p>

            <h2 className="text-lg font-bold text-slate-900">
              {event.title}
            </h2>

            <div className="mt-2 text-sm text-slate-600">
              {event.eventDate && (
                <span>
                  {new Date(event.eventDate).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                    timeZone: "Asia/Tokyo",
                  })}
                  {" "}
                  {new Date(event.eventDate).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Tokyo",
                  })}
                  〜

                  {new Date(event.endDate).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                    timeZone: "Asia/Tokyo",
                  })}
                  {" "}
                  {new Date(event.endDate).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Tokyo",
                  })}
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

      {/* メインカード */}
      <Card className="border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <CardHeader className="border-b border-slate-200 pb-6">
            <CardTitle>レポート内容</CardTitle>
            <CardDescription>
              外部サイトでレポートを公開している場合は、「外部URL」をONにしてURLを入力してください。
              <br />
              外部URLが設定されている場合、詳細画面の「レポート」ボタンから該当ページへ遷移します。
              <br />
              公開先がない場合はOFFのまま、活動記録（必須）や画像・PDFを入力してください。
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 pt-6">
            {/* 外部URL */}
            <div>
              <OptionalUrlField
                id="external-url"
                toggleId="external-url-toggle"
                enabled={formState.externalUrlEnabled}
                onEnabledChange={(enabled) =>
                  setFormState((prev) => ({
                    ...prev,
                    externalUrlEnabled: enabled,
                    ...(enabled && {
                      content: "",
                      reportImages: [],
                      reportPdfs: [],
                    }),
                  }))
                }
                url={formState.externalUrl}
                onUrlChange={(url) =>
                  setFormState((prev) => ({
                    ...prev,
                    externalUrl: url,
                  }))
                }
                error={validationErrors.externalUrl}
              />
            </div>

            {/* 区切り線 */}
            <div className="border-t border-slate-200" />

            {!formState.externalUrlEnabled ? (
              <>
                {/* 活動記録テキスト */}
                <div className="space-y-2">
                  <label
                    htmlFor="content"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    活動した記録 <span className="text-red-600">*</span>
                  </label>
                  <FieldNote>
                    イベント参加時に行った活動内容を詳しく記述してください
                  </FieldNote>
                  <Textarea
                    id="content"
                    placeholder="例：〇〇について学びました。特に〇〇の部分が印象的でした..."
                    value={formState.content}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    className="min-h-32 resize-none"
                  />
                  {validationErrors.content && (
                    <FieldNote tone="error">
                      {validationErrors.content}
                    </FieldNote>
                  )}
                  <FieldNote>{formState.content.length} / 2000 文字</FieldNote>
                </div>

                {/* 区切り線 */}
                <div className="border-t border-slate-200" />

                {/* 画像セクション */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <ImageIcon className="h-5 w-5 text-teal-600" />
                    <span>活動している様子の画像</span>
                  </div>
                  <MultiFileField
                    id="report-images"
                    label="画像を選択"
                    hint="活動の様子が分かる画像があれば添付してください（最大10枚）"
                    accept="image/*"
                    selectedFiles={formState.reportImages}
                    onSelectedFilesChange={(files) =>
                      setFormState((prev) => ({
                        ...prev,
                        reportImages: files,
                      }))
                    }
                    maxFiles={10}
                    className="mt-4"
                    error={validationErrors.reportImages}
                    disabled={formState.externalUrlEnabled}
                  />
                </div>

                {/* 区切り線 */}
                <div className="border-t border-slate-200" />

                {/* PDF */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <FileText className="h-5 w-5 text-teal-600" />
                    <span>資料PDF</span>
                  </div>
                  <MultiFileField
                    id="report-pdfs"
                    label="PDF資料"
                    hint="学習資料やレポート用紙などのPDFがあれば、3つまでアップロード可能です"
                    accept="application/pdf"
                    selectedFiles={formState.reportPdfs}
                    onSelectedFilesChange={(files) =>
                      setFormState((prev) => ({
                        ...prev,
                        reportPdfs: files,
                      }))
                    }
                    maxFiles={3}
                    className="mt-4"
                    error={validationErrors.reportPdfs}
                  />
                </div>
              </>
            ) : null}
          </CardContent>

          {/* フッター */}
          <CardFooter className="border-t border-slate-200 flex gap-3 pt-6">
            <Button
              className="cursor-pointer border-transparent hover:border-slate-300"
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="cursor-pointer border border-transparent hover:border-slate-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? "投稿中..." : "レポートを投稿"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
