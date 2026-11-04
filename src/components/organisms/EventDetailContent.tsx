"use client";

import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { EventDetail } from "@/components/organisms/EventDetail";
import { useEventDetail } from "@/hooks/useEventDetail";

type EventDetailContentProps = {
  // サーバー側で取得済みのイベント詳細。
  initialEvent: EventDetailType;
};

// イベント詳細ページのクライアント側エントリーポイント。
// サーバーで描画した初期データを表示しつつ、操作に必要な再取得を担当する。
export function EventDetailContent({
  initialEvent,
}: Readonly<EventDetailContentProps>) {
  const { event, report, refetchEvent } = useEventDetail(initialEvent);

  return (
    <EventDetail event={event} report={report} onEventRefetch={refetchEvent} />
  );
}
