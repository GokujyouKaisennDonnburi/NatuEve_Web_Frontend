"use client";

import { EventStatusLabel } from "@/components/atoms/EventStatusLabel";
import { useCurrentUserContext } from "@/components/layouts/AuthProvider";
import {
  EVENT_DETAIL_ATTACHMENTS_SECTION_ID,
  EVENT_DETAIL_INFO_SECTION_ID,
  EVENT_DETAIL_OVERVIEW_SECTION_ID,
} from "@/components/molecules/event-detail/eventDetailTocSections";
import { EventImageCarousel } from "@/components/molecules/event-detail/EventImageCarousel";
import { EventInfoTable } from "@/components/molecules/event-detail/EventInfoTable";
import { EventPdfList } from "@/components/molecules/event-detail/EventPdfList";
import { EventTagList } from "@/components/molecules/event-detail/EventTagList";
import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";
import { SurfaceCard } from "@/components/molecules/SurfaceCard";
import { CardContent } from "@/components/ui/card";
import type { EventPostFormState } from "@/hooks/useEventPostForm";
import { buildLocation } from "@/utils/regionSearch";
import { resolveEventStatus } from "@/utils/eventStatus";
import { Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// 投稿日の表示用に日付だけを整形する
const formatPostedDate = (value: string): string =>
  new Date(value).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });

// datetime-local の入力値を RFC3339 へ変換する。空や不正な値は空文字のまま返す。
const toRfc3339OrEmpty = (value: string): string => {
  if (!value.trim()) {
    return "";
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
};

// イベント投稿プレビューのprops型
type EventPostPreviewProps = {
  formState: EventPostFormState;
};

// イベント投稿フォームの入力値を、イベント詳細画面で表示される形式へ変換する。
export function EventPostPreview({
  formState,
}: Readonly<EventPostPreviewProps>) {
  const { user } = useCurrentUserContext();

  // File を表示用の object URL に変換し、不要になったら解放する。
  const [imageObjectUrls, setImageObjectUrls] = useState<string[]>([]);
  const [pdfObjectUrls, setPdfObjectUrls] = useState<string[]>([]);

  useEffect(() => {
    const nextImageUrls = formState.eventImage
      ? [URL.createObjectURL(formState.eventImage)]
      : [];
    const nextPdfUrls = formState.eventDocuments.map((file) =>
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
  }, [formState.eventImage, formState.eventDocuments]);

  const previewEvent = useMemo<EventDetailType>(() => {
    const costs = formState.feeCategoryGroups
      .filter((group) => group.category.trim() || group.amount.trim())
      .map((group) => ({
        category: group.category,
        cost: Number(group.amount) || 0,
      }));

    const items = formState.requiredItems.map((item) => ({
      item: item.itemName,
      isRequired: item.isRequired,
    }));

    return {
      id: "",
      title: formState.eventName,
      description: formState.eventContent,
      eventDate: toRfc3339OrEmpty(formState.eventDateTime),
      endDate: toRfc3339OrEmpty(formState.endDateTime),
      location: buildLocation(
        formState.prefecture,
        formState.city,
        formState.address,
      ),
      costs,
      items,
      capacity: formState.capacity ? Number(formState.capacity) : 0,
      participantCount: 0,
      // 締切なしのときは undefined にして、詳細画面と同じ「なし」表示にする。
      applicationDeadline: toRfc3339OrEmpty(formState.applicationDeadline) || undefined,
      externalUrl: formState.applicationUrl || undefined,
      imageUrls: imageObjectUrls,
      imageObjectKeys: [],
      imageFilenames: [],
      pdfUrls: pdfObjectUrls,
      pdfObjectKeys: [],
      pdfFilenames: formState.eventDocuments.map((file) => file.name),
      tags: formState.tags,
      profile: user
        ? {
            id: user.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          }
        : { id: "", displayName: "", avatarUrl: "" },
      organizerName: user?.displayName,
      organizerAvatarUrl: user?.avatarUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reports: [],
    };
  }, [formState, user, imageObjectUrls, pdfObjectUrls]);

  const status = resolveEventStatus({
    eventDate: previewEvent.eventDate,
    endDate: previewEvent.endDate,
    applicationDeadline: previewEvent.applicationDeadline,
  });

  const pdfItems = useMemo(() => {
    // Blob URL が未生成の間は描画しない（空 source による key 重複を防ぐ）
    if (pdfObjectUrls.length !== formState.eventDocuments.length) {
      return [];
    }
    return formState.eventDocuments.map((file, index) => ({
      source: pdfObjectUrls[index] ?? "",
      filename: file.name,
    }));
  }, [formState.eventDocuments, pdfObjectUrls]);
  const hasPdf = pdfItems.length > 0;

  const organizerName =
    previewEvent.organizerName ?? previewEvent.profile?.displayName;
  const organizerAvatarUrl =
    previewEvent.organizerAvatarUrl ?? previewEvent.profile?.avatarUrl;

  return (
    <div className="space-y-6 rounded-2xl border border-slate-300 p-6 shadow-sm">
      {/* プレビュー注釈 */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5">
        <Eye className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-700">
          参加者に表示されるプレビュー
        </span>
      </div>

      {/* 画面上部：タイトル・ステータス/タグ・主催者 */}
      <header className="space-y-3">
        <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
          {previewEvent.title || "（タイトル未入力）"}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <EventStatusLabel status={status} />
          <EventTagList tags={previewEvent.tags} />
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
              投稿日 {formatPostedDate(previewEvent.createdAt)}
            </p>
          </div>
        </div>
      </header>

      <div className="min-w-0 flex-1 space-y-6">
        {/* イベント画像 */}
        {imageObjectUrls.length > 0 ? (
          <SurfaceCard>
            <CardContent>
              <EventImageCarousel images={imageObjectUrls} unoptimized />
            </CardContent>
          </SurfaceCard>
        ) : null}

        {/* イベント概要 */}
        <section id={EVENT_DETAIL_OVERVIEW_SECTION_ID} className="scroll-mt-24">
          <SurfaceCard>
            <CardContent>
              <h2 className="section-title">イベント概要</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                {previewEvent.description || "（概要未入力）"}
              </p>
            </CardContent>
          </SurfaceCard>
        </section>

        {/* イベント詳細 */}
        <section id={EVENT_DETAIL_INFO_SECTION_ID} className="scroll-mt-24">
          <EventInfoTable event={previewEvent} />
        </section>

        {/* 添付資料 */}
        {hasPdf ? (
          <section
            id={EVENT_DETAIL_ATTACHMENTS_SECTION_ID}
            className="scroll-mt-24"
          >
            <EventPdfList pdfItems={pdfItems} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
