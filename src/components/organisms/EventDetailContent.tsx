"use client";

import type { EventDetailType } from "@/components/molecules/event-detail/types";
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
  const { event, report, refetchEvent } = useEventDetail(
    initialEvent,
    initialNow,
  );

  return (
    <EventDetail
      event={event}
      report={report}
      onEventRefetch={refetchEvent}
      initialNow={initialNow}
    />
  );
}
