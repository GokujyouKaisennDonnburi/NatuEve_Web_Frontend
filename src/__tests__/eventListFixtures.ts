import { EVENT_LIST_FETCH_PAGE_SIZE } from "@/constants/config";
import type { EventListItem } from "@/types/event";

// イベント一覧系フックのテストで共有するフィクスチャ。
// EventListItem のフィールド追加時に各テストへ同じ修正を強いないよう集約する。
export const day = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

export const buildEvent = (
  id: string,
  eventDate: string,
  endDate: string,
  options?: { cancelledAt?: string },
): EventListItem => ({
  id,
  createdAt: "2026-01-01T00:00:00+09:00",
  eventDate,
  endDate,
  location: "東京都新宿区",
  profileId: "profile-1",
  title: `イベント ${id}`,
  profile: { id: "profile-1", displayName: "主催者", avatarUrl: "" },
  ...(options?.cancelledAt ? { cancelledAt: options.cancelledAt } : {}),
});

type EventListResponseLike<Counts> = {
  counts: Counts;
  events: EventListItem[];
  limit: number;
  offset: number;
  totalCount: number;
};

export const buildEventListResponse = <Counts>(
  events: EventListItem[],
  counts: Counts,
  totalCount = events.length,
): EventListResponseLike<Counts> => ({
  counts,
  events,
  limit: EVENT_LIST_FETCH_PAGE_SIZE,
  offset: 0,
  totalCount,
});
