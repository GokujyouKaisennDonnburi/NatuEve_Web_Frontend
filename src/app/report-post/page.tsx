"use client";

import { FieldNote } from "@/components/atoms/event-post/FieldNote";

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
import { createReport } from "@/services/report";
import { uploadFile } from "@/services/upload";
import type { CreateReportRequest } from "@/types/report";
import { findUploadValidationError } from "@/utils/upload";
import { FileText, Image as ImageIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

  // バリデーション
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

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

    if (formState.externalUrlEnabled && !formState.externalUrl.trim()) {
      errors.externalUrl = "URLを入力してください";
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
      // 画像をアップロード
      const imageObjectKeys: string[] = [];
      for (const image of formState.reportImages) {
        const objectKey = await uploadFile(image, "image");
        imageObjectKeys.push(objectKey);
      }

      // PDFをアップロード（存在する場合）
      const pdfObjectKeys: string[] = [];
      for (const pdfFile of formState.reportPdfs) {
        const objectKey = await uploadFile(pdfFile, "pdf");
        pdfObjectKeys.push(objectKey);
      }

      // レポート作成リクエストを組み立て
      const payload: CreateReportRequest = {
        eventId,
        content: formState.content.trim(),
        imageObjectKeys,
        ...(formState.externalUrlEnabled &&
          formState.externalUrl.trim() && {
            externalUrl: formState.externalUrl.trim(),
          }),
        ...(pdfObjectKeys.length > 0 && { pdfObjectKeys }),
      };

      // レポート作成 API を呼び出し
      const _response = await createReport(payload);

      toast.success("レポートを投稿しました");
      router.push(ROUTES.EVENT_LIST);
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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-8">
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

        {/* メインカード */}
        <Card className="border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            <CardHeader className="border-b border-slate-200 pb-6">
              <CardTitle>レポート内容</CardTitle>
              <CardDescription>
                外部サイトでレポートを公開している場合は、「外部URL」をONにしてURLを入力してください。<br/>
                外部URLが設定されている場合、詳細画面の「レポート」ボタンから該当ページへ遷移します。<br/>
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
                      活動した記録{" "}
                      <span className="text-red-600">*</span>
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
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? "投稿中..." : "レポートを投稿"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
