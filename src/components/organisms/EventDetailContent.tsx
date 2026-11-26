"use client";

import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { EventGoneNotice } from "@/components/molecules/EventGoneNotice";
import { EventDetail } from "@/components/organisms/EventDetail";
import { useEventDetail } from "@/hooks/useEventDetail";

type EventDetailContentProps = {
  // サーバー側で取得済みのイベント詳細。
  initialEvent: EventDetailType;
  // SSR 時の描画時刻(epoch ms)。サーバー HTML とハイドレーション時の表示を揃える。
  initialNow: number;
};

// イベント詳細ページのクライアント側エントリーポイント。
// サーバーで描画した初期データを表示しつつ、操作に必要な再取得を担当する。
export function EventDetailContent({
  initialEvent,
  initialNow,
}: Readonly<EventDetailContentProps>) {
  const { event, report, refetchEvent, isGone } = useEventDetail(
    initialEvent,
    initialNow,
  );

  // 開いている間に取りやめられた場合は、古い内容を表示し続けない（ADR-0008）。
  if (isGone) {
    return <EventGoneNotice />;
  }

  return (
    <EventDetail
      event={event}
      report={report}
      onEventRefetch={refetchEvent}
      initialNow={initialNow}
    />
  );
}
