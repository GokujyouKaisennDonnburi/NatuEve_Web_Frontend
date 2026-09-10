"use client";

import type { EventItem } from "@/components/organisms/EventCard";
import { fetchEventList } from "@/services/event";
import type { EventListStatus } from "@/types/event";
import { resolveEventStatus } from "@/utils/eventStatus";
import { buildLocationFilters } from "@/utils/regionSearch";
import { useEffect, useState } from "react";

type UseEventListParams = {
  currentPage: number;
  sortBy: "created_at" | "event_date";
  searchQuery: string;
  selectedTagIds: string[];
  selectedStatuses: string[];
  // 適用済みの地域フィルター（都道府県・市区町村）
  prefectures: string[];
  cities: string[];
  itemsPerPage: number;
};

type UseEventListReturn = {
  events: EventItem[];
  totalCount: number;
  loading: boolean;
  error: string | null;
};

export function useEventList({
  currentPage,
  sortBy,
  searchQuery,
  selectedTagIds,
  selectedStatuses,
  prefectures,
  cities,
  itemsPerPage,
}: UseEventListParams): UseEventListReturn {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchEvents = async (attempt = 0): Promise<void> => {
      if (cancelled) return;
      setLoading(true);
      setError(null);

      try {
        const offset = (currentPage - 1) * itemsPerPage;
        const order = sortBy === "event_date" ? "asc" : "desc";

        // 検索クエリが空・空白のみの場合は keywords を未指定にして、
        // キーワードなしの通常の一覧取得とする
        let keywords: string[] | undefined;
        if (searchQuery) {
          keywords = searchQuery
            .split(/[\s\u3000]+/)
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword.length > 0)
            .slice(0, 10);
          if (keywords.length === 0) keywords = undefined;
        }

        const tagIds = selectedTagIds.length > 0 ? selectedTagIds : undefined;
        const locations = buildLocationFilters(prefectures, cities);

        const validSelectedStatuses: EventListStatus[] = selectedStatuses.filter(
          (s): s is EventListStatus =>
            s === "upcoming" || s === "ongoing" || s === "ended",
        );

        // 「開催日が近い順」では終了日が過ぎていないイベントのみを対象とするため、
        // 開催前(upcoming)・開催中(ongoing)を常に status に含める。
        // ユーザーが開催状況フィルターを選択している場合は和集合とする。
        const statuses: EventListStatus[] | undefined =
          sortBy === "event_date"
            ? Array.from(
                new Set<EventListStatus>([
                  "upcoming",
                  "ongoing",
                  ...validSelectedStatuses,
                ]),
              )
            : validSelectedStatuses.length > 0
              ? validSelectedStatuses
              : undefined;

        const data = await fetchEventList({
          sort: sortBy,
          order,
          limit: itemsPerPage,
          offset,
          keywords,
          tagIds,
          status: statuses,
          locations: locations.length > 0 ? locations : undefined,
        });

        if (!cancelled) {
          const visibleApiEvents = data.events.filter(
            (apiEvent) => apiEvent.cancelledAt == null,
          );

          const mappedEvents: EventItem[] = visibleApiEvents.map((apiEvent) => {
            const status = resolveEventStatus({
              eventDate: apiEvent.eventDate,
              endDate: apiEvent.endDate,
              applicationDeadline: apiEvent.applicationDeadline,
            });

            return {
              id: apiEvent.id,
              title: apiEvent.title,
              location: apiEvent.location,
              eventDate: apiEvent.eventDate,
              endDate: apiEvent.endDate,
              profileId: apiEvent.profileId,
              hostName: apiEvent.profile?.displayName ?? "名無しのゲンゴロウ",
              hostAvatarUrl: apiEvent.profile?.avatarUrl ?? "",
              tags: apiEvent.tags,
              status,
            };
          });

          // 順序は API（sort / order / status クエリ）が保証するため、
          // レスポンスをそのまま表示に使う。クライアント側での再ソートは
          // ページングされた現在ページしか並べ替えられず、ページをまたいだ
          // 順序が破綻するため行わない。
          setEvents(mappedEvents);
          setTotalCount(
            data.totalCount - (data.events.length - visibleApiEvents.length),
          );
        }
      } catch (err) {
        if (!cancelled && attempt < 5) {
          setTimeout(() => void fetchEvents(attempt + 1), 200 * (attempt + 1));
          return;
        }
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "イベント一覧の取得に失敗しました",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchEvents();
    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    sortBy,
    searchQuery,
    selectedTagIds,
    selectedStatuses,
    prefectures,
    cities,
    itemsPerPage,
  ]);

  return { events, totalCount, loading, error };
}
