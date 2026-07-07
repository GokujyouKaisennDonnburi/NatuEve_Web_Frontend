"use client";

import { EventCancelButton } from "@/components/atoms/event-post/EventCancelButton";
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

  // 主催者のIDを取得
  const organizerId = event.profile?.id;

  const router = useRouter();
  const { session } = useAuth();

  // ログイン中のユーザーが当該イベントの投稿者（主催者）かどうか
  const isOrganizer = Boolean(
    session?.userId && organizerId && session.userId === organizerId,
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

        {/* アイコンと名前の表示部分をLinkで囲む */}
        <div className="mt-2 w-fit">
          {organizerId ? (
            <Link
              href={isOrganizer ? "/mypage" : `/users/${organizerId}`}
              className="flex items-center gap-2 text-sm text-slate-600 hover:opacity-80 transition-opacity cursor-pointer group"
            >
              <GlobalUserAvatar
                name={organizerName}
                iconUrl={organizerAvatarUrl}
                className="h-5 w-5 border-slate-300 group-hover:ring-2 group-hover:ring-emerald-100 transition-all"
              />
              <span className="font-medium text-slate-700 group-hover:text-emerald-600 transition-colors">
                {organizerName ?? "未設定"}
              </span>
            </Link>
          ) : (
            // IDがない（過去のデータ等で紐付いていない）場合のフォールバック（リンクなし）
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <GlobalUserAvatar
                name={organizerName}
                iconUrl={organizerAvatarUrl}
                className="h-5 w-5 border-slate-300"
              />
              <span className="font-medium text-slate-700">
                {organizerName ?? "未設定"}
              </span>
            </div>
          )}
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

      {/* イベント投稿者向けボタンと参加申し込みボタンの切り替え */}
      {/* スクロール中も画面下部に固定で表示する */}
      <div className="sticky bottom-4 z-40">
        {isOrganizer ? (
          <EventCancelButton eventId={event.id} />
        ) : (
          <EventParticipationButton eventId={event.id} />
        )}
      </div>
    </div>
  );
}

export default EventDetail;
