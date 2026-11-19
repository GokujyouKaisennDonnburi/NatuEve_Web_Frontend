import type { EventListItem } from "@/types/event";

// バックエンドは一覧・counts・totalCount にキャンセル済みイベントを含めて返すため
// （ADR-0012 / ADR-0024）、表示対象の除外と除外件数の算出を共通化する。
export const splitCancelledEvents = (
  events: EventListItem[],
): { visibleEvents: EventListItem[]; cancelledCount: number } => {
  const visibleEvents = events.filter((event) => event.cancelledAt == null);
  return {
    visibleEvents,
    cancelledCount: events.length - visibleEvents.length,
  };
};
