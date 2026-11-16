import { PAGE_TITLES } from "@/constants/pageTitles";
import type { EventDetailResponse } from "@/types/event";
import { buildEventMetadata } from "@/utils/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type LoadEventDetail = (eventId: string) => Promise<EventDetailResponse | null>;

// ページ本体と generateMetadata で共有する 404 判定。
// イベントが存在しない場合は notFound() を呼び、それ以外は詳細を返す。
export async function loadEventDetailOrNotFound(
  eventId: string,
  loadEvent: LoadEventDetail,
): Promise<EventDetailResponse> {
  const event = await loadEvent(eventId);

  if (!event) {
    notFound();
  }

  return event;
}

// イベント詳細ページの metadata を組み立てる。
// ネストした not-found の metadata は Next.js に反映されないため、
// 404 時もここでタイトルを返し、ページ本体の notFound() で 404 を維持する。
export async function getEventDetailMetadata(
  eventId: string,
  loadEvent: LoadEventDetail,
): Promise<Metadata> {
  const event = await loadEvent(eventId);

  if (!event) {
    return { title: PAGE_TITLES.EVENT_DETAIL_NOT_FOUND };
  }

  return buildEventMetadata(event);
}
