"use client";

import { BackLink } from "@/components/atoms/BackLink";
import { EventStatusLabel } from "@/components/atoms/EventStatusLabel";
import { EventCancelModal } from "@/components/molecules/event-detail/EventCancelModal";
import {
  type EventDetailTab,
  EventDetailTabs,
  eventDetailTabId,
} from "@/components/molecules/event-detail/EventDetailTabs";
import { EventImageCarousel } from "@/components/molecules/event-detail/EventImageCarousel";
import { EventInfoTable } from "@/components/molecules/event-detail/EventInfoTable";
import { EventMemberListModal } from "@/components/molecules/event-detail/EventMemberListModal";
import { EventNotifyModal } from "@/components/molecules/event-detail/EventNotifyModal";
import { EventOrganizerToolbar } from "@/components/molecules/event-detail/EventOrganizerToolbar";
import { EventPdfList } from "@/components/molecules/event-detail/EventPdfList";
import { EventReportList } from "@/components/molecules/event-detail/EventReportList";
import { EventTagList } from "@/components/molecules/event-detail/EventTagList";
import {
  EVENT_DETAIL_ATTACHMENTS_SECTION_ID,
  EVENT_DETAIL_INFO_SECTION_ID,
  EVENT_DETAIL_OVERVIEW_SECTION_ID,
  EVENT_DETAIL_TOC_SECTIONS,
} from "@/components/molecules/event-detail/eventDetailTocSections";
import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";
import { PageToc } from "@/components/molecules/PageToc";
import { SurfaceCard } from "@/components/molecules/SurfaceCard";
import { EventParticipationButton } from "@/components/organisms/EventParticipationButton";
import { useAuthContext } from "@/components/layouts/AuthProvider";
import { CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useEventMembers } from "@/hooks/useEventMembers";
import { useMyEventApplication } from "@/hooks/useMyEventApplication";
import { useParticipationLogs } from "@/hooks/useParticipationLogs";
import type { ReportDetail } from "@/types/report";
import { resolveEventStatus } from "@/utils/eventStatus";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

// 投稿日の表示用に日付だけを整形する
const formatPostedDate = (value: string): string =>
  new Date(value).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });

// イベント詳細コンポーネント
export function EventDetail({
  event,
  report,
  onEventRefetch,
}: {
  event: EventDetailType;
  report?: ReportDetail | null;
  // イベント詳細を再取得するコールバック。参加/キャンセル後に最新の定員情報を反映する。
  onEventRefetch?: () => void;
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

  // 表示中のタブ（詳細 / 活動レポート）
  const [activeTab, setActiveTab] = useState<EventDetailTab>("detail");

  // 添付資料（PDF）。URL が無い場合は objectKey にフォールバックする
  const pdfSources = event.pdfUrls?.length
    ? event.pdfUrls
    : (event.pdfObjectKeys ?? []);
  const pdfItems = pdfSources.map((source, index) => ({
    source,
    filename: event.pdfFilenames?.[index] ?? "",
  }));
  const hasPdf = pdfItems.length > 0;

  // 添付資料が無いイベントでは目次から「添付資料」を落とす
  const tocSections = useMemo(
    () =>
      EVENT_DETAIL_TOC_SECTIONS.filter(
        (section) =>
          section.id !== EVENT_DETAIL_ATTACHMENTS_SECTION_ID || hasPdf,
      ),
    [hasPdf],
  );

  // 開催状況は共通ルールで判定する。詳細 API は endDate を必ず返すため、
  // 開催中（開始済み・未終了）のイベントは「開催終了」にならない。
  // 「期限間近」は申込期限の1週間前から申込期限までに表示される。
  const status = resolveEventStatus({
    eventDate: event.eventDate,
    endDate: event.endDate,
    applicationDeadline: event.applicationDeadline,
  });

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

  // 申し込み内容（申込日時・カテゴリ別の内訳）の取得。
  // 申込内容は参加中のユーザーにしか存在しないため、参加中と判明してから取得する。
  // モーダルを開いた時点で内容が揃っているよう、押下時ではなくここで先読みする。
  const { data: myApplication } = useMyEventApplication(
    participating ? event.id : null,
  );

  // 申し込み内容モーダルに渡す申し込み内容。参加中のときだけ意味を持つ。
  // 取得できていない間・取得に失敗した場合は中身が空のまま渡し、
  // モーダル側で日時「—」・内訳非表示にフォールバックさせる。
  const participationDetail = useMemo(
    () =>
      participating
        ? {
            appliedAt: myApplication?.createdAt ?? null,
            participants: myApplication?.participants,
          }
        : undefined,
    [participating, myApplication],
  );

  return (
    <div
      className={cn(
        "space-y-6",
        // 主催者ツールバーは fixed でビューポート右端から約86px を占有する。
        // 画面幅が xl 未満だと本文の右端がツールバーの下に潜り込むため、
        // 主催者に表示しているときだけ右側に逃げ幅を確保する。
        isOrganizer && "lg:pr-24 xl:pr-0",
      )}
    >
      {/* 画面上部：もどるリンク・タイトル・ステータス/タグ・主催者 */}
      <header className="space-y-3">
        <BackLink href={ROUTES.EVENT_LIST}>イベント一覧にもどる</BackLink>

        {/* タイトル */}
        <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
          {event.title}
        </h1>

        {/* 受付状況とタグ（タグはバックエンド未対応時 undefined → 非表示） */}
        <div className="flex flex-wrap items-center gap-2">
          <EventStatusLabel status={status} />
          <EventTagList tags={event.tags} />
        </div>

        {/* 主催者と投稿日。アイコンと名前は主催者のプロフィールへのリンクにする */}
        {organizerId ? (
          <Link
            href={
              isOrganizer ? ROUTES.MYPAGE : `${ROUTES.USERS}/${organizerId}`
            }
            className="group flex w-fit items-center gap-2 transition-opacity hover:opacity-80"
          >
            <GlobalUserAvatar
              name={organizerName}
              iconUrl={organizerAvatarUrl}
              className="h-9 w-9 border-slate-300 transition-all group-hover:ring-2 group-hover:ring-emerald-100"
            />
            <div>
              <p className="text-sm font-bold text-slate-800 transition-colors group-hover:text-(--brand-green-text)">
                {organizerName ?? "未設定"}
              </p>
              <p className="text-xs text-slate-500">
                投稿日 {formatPostedDate(event.createdAt)}
              </p>
            </div>
          </Link>
        ) : (
          // IDがない（過去のデータ等で紐付いていない）場合のフォールバック（リンクなし）
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
        )}
      </header>

      {/* 詳細 / 活動レポート の切り替えタブ。
          主催者はレポート未投稿でも空状態（作成ボタン付き）を確認できるようにし、
          非主催者はレポート未投稿のときタブを開けないようにする。 */}
      <EventDetailTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showReportBadge={isOrganizer && !report}
        reportTabDisabled={!isOrganizer && !report}
      />

      {activeTab === "detail" ? (
        <div
          role="tabpanel"
          aria-labelledby={eventDetailTabId("detail")}
          className="flex flex-col gap-8 lg:flex-row"
        >
          {/* 目次（イベント投稿フォームと共通コンポーネント） */}
          <aside className="hidden shrink-0 lg:block lg:w-44">
            <PageToc sections={tocSections} />
          </aside>

          <div className="min-w-0 flex-1 space-y-6">
            {/* イベント画像（固定アスペクト） */}
            {images.length > 0 ? (
              <SurfaceCard>
                <CardContent>
                  <EventImageCarousel images={images} />
                </CardContent>
              </SurfaceCard>
            ) : null}

            {/* イベント概要 */}
            <section
              id={EVENT_DETAIL_OVERVIEW_SECTION_ID}
              className="scroll-mt-24"
            >
              <SurfaceCard>
                <CardContent>
                  <h2 className="section-title">イベント概要</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
                    {event.description}
                  </p>
                </CardContent>
              </SurfaceCard>
            </section>

            {/* イベント詳細（表形式） */}
            <section id={EVENT_DETAIL_INFO_SECTION_ID} className="scroll-mt-24">
              <EventInfoTable event={event} />
            </section>

            {/* 添付資料（PDF） */}
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
      ) : (
        // 活動レポート（未投稿のときは空状態を EventReportList 側で描画する）
        <div role="tabpanel" aria-labelledby={eventDetailTabId("report")}>
          <EventReportList
            report={report}
            eventId={event.id}
            isOrganizer={isOrganizer}
          />
        </div>
      )}

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

      {/* 参加申し込みボタン。スクロール中も画面下部に固定で表示する。 */}
      {/* 主催者にはイベントの削除をツールバーの削除ボタンに一本化しているため何も出さない。 */}
      {isOrganizer ? null : (
        <div className="sticky bottom-4 z-40">
          {participationError ? (
            <p className="text-center text-sm text-slate-500">
              参加状態の取得に失敗しました。
              参加申し込みは通常通りご利用いただけます。
            </p>
          ) : null}
          <EventParticipationButton
            eventId={event.id}
            eventTitle={event.title}
            eventDate={event.eventDate}
            eventEndDate={event.endDate}
            eventLocation={event.location}
            organizerName={organizerName}
            // 取り消し・欠席連絡の期限。バックエンドの判定基準は申込期限のため
            // applicationDeadline を使い、将来 cancelDeadline が返る場合はそちらを優先する。
            participationDeadline={
              event.cancelDeadline ?? event.applicationDeadline
            }
            costs={event.costs}
            capacity={event.capacity}
            participantCount={event.participantCount}
            participating={participating}
            participationDetail={participationDetail}
            partySize={myApplication?.partySize}
            receptionClosed={status === "closed"}
            onParticipateSuccess={() => {
              refetchParticipation();
              onEventRefetch?.();
            }}
            onCancelSuccess={() => {
              refetchParticipation();
              onEventRefetch?.();
            }}
          />
        </div>
      )}
    </div>
  );
}

export default EventDetail;
