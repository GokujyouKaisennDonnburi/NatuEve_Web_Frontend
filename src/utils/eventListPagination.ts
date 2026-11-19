import type { EventListItem } from "@/types/event";

type EventPage = {
  events: EventListItem[];
  totalCount: number;
};

// バックエンドは maxLimit(100) を超える件数を複数ページに分けて返すため、
// counts / totalCount を全件基準で補正できるよう全ページ取得する。
// isCancelled には useEffect のクリーンアップフラグの現在値を返す関数を渡す。
export const fetchAllEventPages = async <T extends EventPage>(
  fetchPage: (offset: number) => Promise<T>,
  isCancelled: () => boolean,
): Promise<{ allEvents: EventListItem[]; firstPage: T }> => {
  const firstPage = await fetchPage(0);
  const allEvents = [...firstPage.events];
  let offset = allEvents.length;

  while (!isCancelled() && allEvents.length < firstPage.totalCount) {
    const page = await fetchPage(offset);
    if (page.events.length === 0) break;
    allEvents.push(...page.events);
    offset += page.events.length;
  }

  return { allEvents, firstPage };
};
