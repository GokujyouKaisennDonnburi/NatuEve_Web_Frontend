"use client";

import { EventCancelButton } from "@/components/atoms/event-post/EventCancelButton";
import { EventNotifyButton } from "@/components/atoms/event-post/EventNotifyButton";
import { EventImageCarousel } from "@/components/molecules/event-detail/EventImageCarousel";
import { EventInfoTable } from "@/components/molecules/event-detail/EventInfoTable";
import { EventMemberListModal } from "@/components/molecules/event-detail/EventMemberList";
import { EventPdfList } from "@/components/molecules/event-detail/EventPdfList";
import { EventReportList } from "@/components/molecules/event-detail/EventReportList";
import { EventTagList } from "@/components/molecules/event-detail/EventTagList";
import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";
import { EventParticipationButton } from "@/components/organisms/EventParticipationButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { useEventMembers } from "@/hooks/useEventMembers";
import { useParticipationLogs } from "@/hooks/useParticipationLogs";
import type { ReportDetail } from "@/types/report";
import { ChevronLeft, FileText, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

  // 参加者一覧の取得（主催者のみ）
  const memberState = useEventMembers(isOrganizer ? event.id : null);
  const hasMembers = memberState.data ? memberState.data.totalCount > 0 : true;

  // 参加者一覧モーダルの開閉状態（主催者のみ操作可能）
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);

  // 参加状態取得（主催者以外のログインユーザーのみ）
  // 未ログイン時は取得をスキップし、participating=false として扱う。
  const isAuthenticated = Boolean(session?.token);
  const {
    data: participationData,
    refetch: refetchParticipation,
    error: participationError,
  } = useParticipationLogs(isOrganizer ? null : event.id, isAuthenticated);
  const participating = participationData?.participating ?? false;

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

        {/* 主催者向けのボタン群（全体連絡ボタン、レポート作成ボタン） */}
        {isOrganizer ? (
          <div className="flex items-center gap-2">
            <EventNotifyButton eventId={event.id} disabled={!hasMembers} />
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
          </div>
        ) : null}
      </div>

      {/* タイトル */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          {event.title}
        </h1>

        {/* タグ表示(Qiita 風)バックエンド未対応時は undefined → フォールバック */}
        <EventTagList tags={event.tags} />

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

      {/* 参加者一覧モーダル（主催者のみ。右側固定ボタンから開く） */}
      {isOrganizer ? (
        <EventMemberListModal
          memberState={memberState}
          isOpen={isMemberListOpen}
          onClose={() => setIsMemberListOpen(false)}
        />
      ) : null}

      {/* イベント投稿者向けボタンと参加申し込みボタンの切り替え */}
      {/* スクロール中も画面下部に固定で表示する */}
      <div className="sticky bottom-4 z-40">
        {isOrganizer ? (
          <EventCancelButton eventId={event.id} hasMembers={hasMembers} />
        ) : (
          <>
            {participationError ? (
              <p className="text-center text-sm text-slate-500">
                参加状態の取得に失敗しました。
                参加申し込みは通常通りご利用いただけます。
              </p>
            ) : null}
            <EventParticipationButton
              eventId={event.id}
              capacity={event.capacity}
              participating={participating}
              onParticipateSuccess={refetchParticipation}
              onCancelSuccess={refetchParticipation}
            />
          </>
        )}
      </div>

      {/* 参加者一覧ボタン：主催者のみ、画面右側に固定で表示する */}
      {isOrganizer ? (
        <button
          type="button"
          onClick={() => setIsMemberListOpen(true)}
          disabled={!hasMembers}
          className="fixed right-4 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-1 rounded-full bg-linear-to-r from-teal-600 via-emerald-600 to-cyan-600 px-3 py-4 text-white shadow-lg shadow-teal-500/25 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="参加者一覧を開く"
        >
          <Users className="h-5 w-5" />
          <span className="text-xs font-semibold leading-tight tracking-tight">
            参加者
            <br />
            一覧
          </span>
        </button>
      ) : null}
    </div>
  );
}

export default EventDetail;
