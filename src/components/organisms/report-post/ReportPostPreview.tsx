"use client";

import { EventStatusLabel } from "@/components/atoms/EventStatusLabel";
import { PillButton } from "@/components/atoms/PillButton";
import { EventReportList } from "@/components/molecules/event-detail/EventReportList";
import { EventTagList } from "@/components/molecules/event-detail/EventTagList";
import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";
import type { ReportDetail } from "@/types/report";
import { resolveEventStatus } from "@/utils/eventStatus";
import { Eye } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

// 投稿日の表示用に日付だけを整形する
const formatPostedDate = (value: string): string =>
  new Date(value).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });

// レポート投稿フォームの入力状態（プレビューに必要な項目のみ）。
// フォーム状態の管理は別issueのため、構造を重複させず必要分だけ受け取る。
type ReportPostPreviewFormState = {
  content: string;
  reportImages: File[];
  externalUrlEnabled: boolean;
  externalUrl: string;
  reportPdfs: File[];
};

type ReportPostPreviewProps = {
  formState: ReportPostPreviewFormState;
  // プレビューのヘッダー表示に使うイベント情報。未取得の間は null。
  event: EventDetailType | null;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
};

// レポート投稿フォームの入力値を、イベント詳細の活動レポートで表示される
// 形式へ変換してプレビューする。
export function ReportPostPreview({
  formState,
  event,
  onSubmit,
  onCancel,
  isSubmitting,
}: Readonly<ReportPostPreviewProps>) {
  // File を表示用の object URL に変換し、不要になったら解放する。
  const [imageObjectUrls, setImageObjectUrls] = useState<string[]>([]);
  const [pdfObjectUrls, setPdfObjectUrls] = useState<string[]>([]);

  useEffect(() => {
    const nextImageUrls = formState.reportImages.map((file) =>
      URL.createObjectURL(file),
    );
    const nextPdfUrls = formState.reportPdfs.map((file) =>
      URL.createObjectURL(file),
    );

    setImageObjectUrls(nextImageUrls);
    setPdfObjectUrls(nextPdfUrls);

    return () => {
      nextImageUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      nextPdfUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [formState.reportImages, formState.reportPdfs]);

  // 入力値から EventReportList へ渡すレポートを合成する。
  const previewReport = useMemo<ReportDetail>(() => {
    const trimmedExternalUrl = formState.externalUrl.trim();
    return {
      id: "",
      eventId: event?.id ?? "",
      content: formState.externalUrlEnabled ? undefined : formState.content,
      externalUrls:
        formState.externalUrlEnabled && trimmedExternalUrl
          ? [trimmedExternalUrl]
          : undefined,
      imageUrls: imageObjectUrls,
      imageFilenames: formState.reportImages.map((file) => file.name),
      pdfUrls: pdfObjectUrls,
      pdfFilenames: formState.reportPdfs.map((file) => file.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [formState, event, imageObjectUrls, pdfObjectUrls]);

  const organizerName = event?.organizerName ?? event?.profile?.displayName;
  const organizerAvatarUrl =
    event?.organizerAvatarUrl ?? event?.profile?.avatarUrl;

  return (
    <div className="space-y-4">
      <div className="space-y-6 rounded-2xl border border-slate-300 p-6 shadow-sm">
        {/* プレビュー注釈 */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5">
          <Eye className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-700">
            参加者に表示されるプレビュー
          </span>
        </div>

        {event ? (
          <>
            {/* 画面上部：イベントタイトル・ステータス/タグ・主催者 */}
            <header className="space-y-3">
              <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2">
                <EventStatusLabel
                  status={resolveEventStatus({
                    eventDate: event.eventDate,
                    endDate: event.endDate,
                    applicationDeadline: event.applicationDeadline,
                  })}
                />
                <EventTagList tags={event.tags} />
              </div>

              <div className="flex w-fit items-center gap-2">
                <GlobalUserAvatar
                  name={organizerName}
                  iconUrl={organizerAvatarUrl}
                  className="h-9 w-9 border-slate-300"
                />
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {organizerName ?? "未設定"}
                  </p>
                  <p className="text-xs text-slate-500">
                    投稿日 {formatPostedDate(event.createdAt)}
                  </p>
                </div>
              </div>
            </header>
          </>
        ) : (
          <p className="text-sm text-slate-500">イベント情報を取得中…</p>
        )}

        {/* 活動レポート（通常 / 外部URL のどちらかを表示） */}
        <EventReportList report={previewReport} />
      </div>

      {/* 投稿・キャンセルボタン */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <PillButton
          tone="outline"
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </PillButton>

        <PillButton tone="brand" type="button" onClick={() => onSubmit({} as React.FormEvent)} disabled={isSubmitting}>
          {isSubmitting ? "投稿中..." : "レポートを投稿"}
        </PillButton>
      </div>
    </div>
  );
}
