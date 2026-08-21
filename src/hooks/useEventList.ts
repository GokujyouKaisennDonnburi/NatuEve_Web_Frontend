"use client";

import { useEffect, useState } from "react";
import { fetchEventList } from "@/services/event";
import type { EventItem } from "@/components/organisms/EventCard";
import type { EventListStatus } from "@/types/event";
import { resolveEventStatus } from "@/utils/eventStatus";

type UseEventListParams = {
  currentPage: number;
  sortBy: "created_at" | "event_date";
  searchQuery: string;
  selectedTagIds: string[];
  selectedStatuses: string[];
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

        const statuses: EventListStatus[] | undefined =
          selectedStatuses.length > 0
            ? selectedStatuses.filter(
                (s): s is EventListStatus =>
                  s === "upcoming" || s === "ongoing" || s === "ended",
              )
            : undefined;

        const data = await fetchEventList({
          sort: sortBy,
          order,
          limit: itemsPerPage,
          offset,
          keywords,
          tagIds,
          status: statuses,
        });

        if (!cancelled) {
          const visibleApiEvents = data.events.filter(
            (apiEvent) => apiEvent.cancelledAt == null,
          );

          const mappedEvents: EventItem[] = visibleApiEvents.map((apiEvent) => {
            const status = resolveEventStatus({
              eventDate: apiEvent.eventDate,
              endDate: apiEvent.endDate,
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

          const sortedEvents =
            sortBy === "event_date"
              ? [...mappedEvents].sort((a, b) => {
                  const now = new Date();
                  const aDate = new Date(a.eventDate);
                  const bDate = new Date(b.eventDate);
                  const aFuture = aDate >= now;
                  const bFuture = bDate >= now;
                  if (aFuture !== bFuture) {
                    return aFuture ? -1 : 1;
                  }
                  return aDate.getTime() - bDate.getTime();
                })
              : mappedEvents;

          setEvents(sortedEvents);
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
    itemsPerPage,
  ]);

  return { events, totalCount, loading, error };
}
