"use client";

import { EventImageCarousel } from "@/components/molecules/event-detail/EventImageCarousel";
import { EventInfoTable } from "@/components/molecules/event-detail/EventInfoTable";
import { EventPdfList } from "@/components/molecules/event-detail/EventPdfList";
import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// イベント詳細コンポーネント
export function EventDetail({ event }: { event: EventDetailType }) {
  const images = event.imageUrls?.length
    ? event.imageUrls
    : (event.imageObjectKeys ?? []);
  const organizerName = event.organizerName ?? event.profile?.displayName;
  const organizerAvatarUrl =
    event.organizerAvatarUrl ?? event.profile?.avatarUrl;
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* 戻るボタン */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="cursor-pointer bg-transparent hover:bg-transparent"
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> 戻る
        </Button>
      </div>

      {/* タイトル */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          {event.title}
        </h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <GlobalUserAvatar
            name={organizerName}
            iconUrl={organizerAvatarUrl}
            className="h-5 w-5 border-slate-300"
          />
          <span className="font-medium text-slate-700">
            {organizerName ?? "未設定"}
          </span>
        </div>
      </div>

      {/* イベント画像（固定アスペクト）後々配置場所をイベント内容内に変更予定 */}
      {images.length > 0 ? <EventImageCarousel images={images} /> : null}

      {/* イベント概要 */}
      <div>
        <Card>
          <CardContent>
            <h2 className="section-title">イベント概要</h2>
            <p className="text-sm text-slate-800 leading-relaxed">
              {event.description}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* イベント情報（表形式） */}
      <EventInfoTable event={event} />

      {/* 添付資料（PDF） */}
      <EventPdfList
        pdfItems={(event.pdfUrls?.length
          ? event.pdfUrls
          : (event.pdfObjectKeys ?? [])
        ).map((source, index) => ({
          source,
          filename: event.pdfFilenames?.[index] ?? "",
        }))}
      />
    </div>
  );
}

export default EventDetail;
