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
export async function getEventDetailMetadata(
  eventId: string,
  loadEvent: LoadEventDetail,
): Promise<Metadata> {
  const event = await loadEventDetailOrNotFound(eventId, loadEvent);
  return buildEventMetadata(event);
}
