"use client";

import { EventCancelButton } from "@/components/atoms/event-post/EventCancelButton";
import { EventCancelModal } from "@/components/molecules/event-detail/EventCancelModal";
import { EventImageCarousel } from "@/components/molecules/event-detail/EventImageCarousel";
import { EventInfoTable } from "@/components/molecules/event-detail/EventInfoTable";
import { EventMemberListModal } from "@/components/molecules/event-detail/EventMemberListModal";
import { EventNotifyModal } from "@/components/molecules/event-detail/EventNotifyModal";
import { EventOrganizerToolbar } from "@/components/molecules/event-detail/EventOrganizerToolbar";
import { EventPdfList } from "@/components/molecules/event-detail/EventPdfList";
import { EventReportList } from "@/components/molecules/event-detail/EventReportList";
import { EventTagList } from "@/components/molecules/event-detail/EventTagList";
import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";
import { EventParticipationButton } from "@/components/organisms/EventParticipationButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/components/layouts/AuthProvider";
import { ROUTES } from "@/constants/routes";
import { useEventMembers } from "@/hooks/useEventMembers";
import { useParticipationLogs } from "@/hooks/useParticipationLogs";
import type { ReportDetail } from "@/types/report";
import { ChevronLeft } from "lucide-react";
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
  const { session } = useAuthContext();

  // ログイン中のユーザーが当該イベントの投稿者（主催者）かどうか
  const isOrganizer = Boolean(
    session?.userId && organizerId && session.userId === organizerId,
  );

  // 参加者一覧の取得（主催者のみ）
  const memberState = useEventMembers(isOrganizer ? event.id : null);
  const hasMembers = memberState.data ? memberState.data.totalCount > 0 : true;

  // モーダルの開閉状態
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

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
      {/* 一覧画面に戻るボタン */}
      <div className="flex items-center justify-between">
        {/* 一覧画面に戻るリンク */}
        <Button
          variant="link"
          onClick={() => router.push(ROUTES.EVENT_LIST)}
          className="h-auto w-fit cursor-pointer gap-1 p-0 has-[>svg]:px-0 text-sm font-normal tracking-[2px] text-slate-500 hover:text-sky-600 hover:no-underline"
        >
          <ChevronLeft className="h-4 w-4" />
          イベント一覧にもどる
        </Button>
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

      {/* 参加者一覧モーダル */}
      <EventMemberListModal
        memberState={memberState}
        eventTitle={event.title}
        isOpen={isMemberListOpen}
        onOpenChange={setIsMemberListOpen}
        onNotify={() => setIsNotifyOpen(true)}
      />

      {/* 全体連絡モーダル */}
      <EventNotifyModal
        isOpen={isNotifyOpen}
        onOpenChange={setIsNotifyOpen}
        eventId={event.id}
        totalCount={memberState.data?.totalCount ?? 0}
        totalMembers={memberState.data?.totalMembers ?? 0}
      />

      {/* イベント削除モーダル */}
      <EventCancelModal
        isOpen={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        eventId={event.id}
        eventTitle={event.title}
        totalCount={memberState.data?.totalCount ?? 0}
        totalMembers={memberState.data?.totalMembers ?? 0}
      />

      {/* 主催者用のツールバー（画面右側に固定表示） */}
      {isOrganizer ? (
        <EventOrganizerToolbar
          hasMembers={hasMembers}
          onMemberList={() => setIsMemberListOpen(true)}
          onNotify={() => setIsNotifyOpen(true)}
          onDelete={() => setIsCancelOpen(true)}
          onReport={() =>
            router.push(
              `${ROUTES.REPORT_POST}?eventId=${encodeURIComponent(event.id)}`,
            )
          }
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
    </div>
  );
}

export default EventDetail;
