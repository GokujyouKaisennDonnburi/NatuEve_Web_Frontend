"use client";

import { useEffect, useState } from "react";
import { fetchMyEvents } from "@/services/event";
import type { EventItem } from "@/components/organisms/EventCard";
import type { MyEventCounts, MyEventType } from "@/types/event";
import { resolveEventStatus } from "@/utils/eventStatus";

type UseMyEventsReturn = {
  events: EventItem[];
  counts: MyEventCounts | null;
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
};

export function useMyEvents(type: MyEventType): UseMyEventsReturn {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [counts, setCounts] = useState<MyEventCounts | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (cancelled) return;
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchMyEvents(type);

        if (!cancelled) {
          setCounts(data.counts);
          setTotalCount(data.totalCount);

          const mappedEvents: EventItem[] = data.events.map((apiEvent) => {
            const status = apiEvent.cancelledAt
              ? "closed"
              : resolveEventStatus({
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

          setEvents(mappedEvents);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err
              : new Error("イベント一覧の取得に失敗しました"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [type]);

  return { events, counts, totalCount, isLoading, error };
}
