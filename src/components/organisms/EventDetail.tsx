"use client";

import { EventImageCarousel } from "@/components/molecules/event-detail/EventImageCarousel";
import { EventInfoTable } from "@/components/molecules/event-detail/EventInfoTable";
import { EventPdfList } from "@/components/molecules/event-detail/EventPdfList";
import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// イベント詳細コンポーネント
export function EventDetail({ event }: { event: EventDetailType }) {
  const images = event.imageObjectKeys ?? [];
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
      </div>

      {/* イベント画像（固定アスペクト）後々配置場所をイベント内容内に変更予定 */}
      <EventImageCarousel title={event.title} images={images} />

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
      <EventPdfList pdfObjectKeys={event.pdfObjectKeys ?? []} />
    </div>
  );
}

export default EventDetail;
