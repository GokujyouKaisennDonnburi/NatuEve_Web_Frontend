"use client";

import { EventImageCarousel } from "@/components/molecules/event-detail/EventImageCarousel";
import { EventInfoTable } from "@/components/molecules/event-detail/EventInfoTable";
import { EventPdfList } from "@/components/molecules/event-detail/EventPdfList";
import { EventReportList } from "@/components/molecules/event-detail/EventReportList";
import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";
import { EventParticipationButton } from "@/components/organisms/EventParticipationButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import type { ReportDetail } from "@/types/report";
import { ChevronLeft, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// イベント詳細コンポーネント
export function EventDetail({
  event,
  report,
}: {
  event: EventDetailType;
  report?: ReportDetail | null;
}) {
  const images = event.imageUrls?.length
    ? event.imageUrls
    : (event.imageObjectKeys ?? []);
  const organizerName = event.organizerName ?? event.profile?.displayName;
  const organizerAvatarUrl =
    event.organizerAvatarUrl ?? event.profile?.avatarUrl;
  const router = useRouter();
  const { session } = useAuth();

  // ログイン中のユーザーが当該イベントの投稿者（主催者）かどうか
  const isOrganizer = Boolean(
    session?.userId && event.profile?.id && session.userId === event.profile.id,
  );

  return (
    <div className="space-y-6">
      {/* 戻るボタン ＆ 投稿者向けレポート作成ボタン */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="cursor-pointer bg-transparent hover:bg-transparent"
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> 戻る
        </Button>

        {isOrganizer ? (
          <Button
            asChild
            size="sm"
            className="cursor-pointer border border-transparent hover:border-slate-300"
          >
            <Link
              href={`${ROUTES.REPORT_POST}?eventId=${encodeURIComponent(event.id)}`}
            >
              <FileText className="h-4 w-4 mr-2" />
              レポート作成
            </Link>
          </Button>
        ) : null}
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

      {/* レポート */}
      <EventReportList report={report} />

      {/* 参加申し込みボタン（主催者自身のイベントでは非表示） */}
      {/* スクロール中も画面下部に固定で表示する */}
      {!isOrganizer ? (
        <div className="sticky bottom-4 z-40">
          <EventParticipationButton eventId={event.id} />
        </div>
      ) : null}
    </div>
  );
}

export default EventDetail;
