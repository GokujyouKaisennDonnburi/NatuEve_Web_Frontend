"use client";

import { useEffect, useState } from "react";
import { fetchProfileEvents } from "@/services/event";
import type { EventItem } from "@/components/organisms/EventCard";
import { EVENT_LIST_FETCH_PAGE_SIZE } from "@/constants/config";
import type { ProfileEventCounts, ProfileEventType } from "@/types/event";
import { resolveEventStatus } from "@/utils/eventStatus";
import { splitCancelledEvents } from "@/utils/eventVisibility";

type UseProfileEventsReturn = {
  events: EventItem[];
  // 自種別（type）の件数のみキャンセル済み分を補正済み。
  // 他種別はバックエンドの生値のため、ページ側で対応する種別の呼び出しの値に差し替えること。
  counts: ProfileEventCounts | null;
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
};

export function useProfileEvents(
  profileId: string | null | undefined,
  type: ProfileEventType,
): UseProfileEventsReturn {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [counts, setCounts] = useState<ProfileEventCounts | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      if (cancelled) return;
      setIsLoading(true);
      setError(null);

      try {
        const firstPage = await fetchProfileEvents(profileId, type, {
          limit: EVENT_LIST_FETCH_PAGE_SIZE,
          offset: 0,
        });
        const allEvents = [...firstPage.events];
        let offset = allEvents.length;

        // limit 未指定時はバックエンドの defaultLimit(20) に丸められるため、
        // counts / totalCount を全件基準で補正できるよう全ページ取得する
        while (!cancelled && allEvents.length < firstPage.totalCount) {
          const page = await fetchProfileEvents(profileId, type, {
            limit: EVENT_LIST_FETCH_PAGE_SIZE,
            offset,
          });
          if (page.events.length === 0) break;
          allEvents.push(...page.events);
          offset += page.events.length;
        }

        if (!cancelled) {
          // バックエンドはキャンセル済みイベントを一覧に含めて返すため（ADR-0012 / ADR-0024）、
          // イベント一覧画面（useEventList）と同様にフロント側で除外する
          const { visibleEvents, cancelledCount } =
            splitCancelledEvents(allEvents);

          // counts / totalCount にはキャンセル済みが含まれるため、
          // このフックが受け持つ種別（type）の件数から、全ページ取得した
          // イベントに含まれるキャンセル済みの件数を差し引いて補正する。
          // counts の他種別の値は、ページ側で対応する種別の呼び出しの counts に差し替える
          const correctedCounts: ProfileEventCounts = {
            ...firstPage.counts,
            [type]: firstPage.counts[type] - cancelledCount,
          };

          setCounts(correctedCounts);
          setTotalCount(firstPage.totalCount - cancelledCount);

          const mappedEvents: EventItem[] = visibleEvents.map((apiEvent) => {
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
  }, [profileId, type]);

  return { events, counts, totalCount, isLoading, error };
}
