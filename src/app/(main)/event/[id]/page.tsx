import { EventDetailContent } from "@/components/organisms/EventDetailContent";
import { getEventDetailOrNull } from "@/services/event";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import {
  getEventDetailMetadata,
  loadEventDetailOrNotFound,
} from "./eventDetailMetadata";

// 全ページ動的レンダリング（layout の connection()）のため、ISR（revalidate・
// generateStaticParams）は使わない。データ鮮度は unstable_cache の revalidate: 60
// が担保し、HTML は毎リクエスト描画になる。

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

// generateMetadata とページ本体で同じ結果を使い、API の二重呼び出しを避ける。
// 同一リクエスト内は React cache、別RSCリクエスト間は Data Cache で共有する。
// 404 はイベント不存在として null を返し、呼び出し側で notFound() を呼ぶ。
const getEventDetailCached = unstable_cache(
  getEventDetailOrNull,
  ["event-detail"],
  { revalidate: 60 },
);
const getEventDetailForPage = cache(getEventDetailCached);

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return getEventDetailMetadata(id, getEventDetailForPage);
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;
  const event = await loadEventDetailOrNotFound(id, getEventDetailForPage);

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
