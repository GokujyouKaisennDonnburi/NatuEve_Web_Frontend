import { EventDetailContent } from "@/components/organisms/EventDetailContent";
import { EventDetailError } from "@/lib/errors";
import { getEventDetail } from "@/services/event";
import type { EventDetailResponse } from "@/types/event";
import { buildEventMetadata } from "@/utils/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

// イベント詳細の初期 HTML をキャッシュしつつ、更新は1分以内に反映する。
// 参加人数など変わりやすい値は、フォーカス時・参加操作後にクライアント側で再取得する。
export const revalidate = 60;

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

// generateMetadata とページ本体で同じ結果を使い、API の二重呼び出しを避ける。
// 404 はイベント不存在として null を返し、呼び出し側で notFound() を呼ぶ。
const getEventDetailForPage = cache(
  async (eventId: string): Promise<EventDetailResponse | null> => {
    try {
      return await getEventDetail(eventId);
    } catch (error) {
      if (error instanceof EventDetailError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },
);

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventDetailForPage(id);

  if (!event) {
    notFound();
  }

  return buildEventMetadata(event);
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;
  const event = await getEventDetailForPage(id);

  if (!event) {
    notFound();
  }

  // SSR とハイドレーションでステータス表示がずれないよう、描画時刻を渡す。
  const initialNow = Date.now();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <EventDetailContent
        key={event.id}
        initialEvent={event}
        initialNow={initialNow}
      />
    </div>
  );
}
