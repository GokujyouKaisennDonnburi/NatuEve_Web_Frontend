import { EventDetailContent } from "@/components/organisms/EventDetailContent";
import { getEventDetailOrNull } from "@/services/event";
import type { Metadata } from "next";
import { cache } from "react";
import {
  getEventDetailMetadata,
  loadEventDetailOrNotFound,
} from "./eventDetailMetadata";

// 初回アクセス時に生成して ISR キャッシュする。更新は1分以内に反映する。
// 参加人数など変わりやすい値は、タブ復帰時・参加操作後にクライアント側で再取得する。
// 実際のキャッシュ永続化は実行環境の incremental cache に依存する。
export const revalidate = 60;

// 動的ルートを ISR 対象にするため、空配列でも generateStaticParams を export する。
// 空配列の場合、パスはビルド時ではなく初回アクセス時に生成される。
export async function generateStaticParams() {
  return [];
}

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

// generateMetadata とページ本体で同じ結果を使い、API の二重呼び出しを避ける。
// 404 はイベント不存在として null を返し、呼び出し側で notFound() を呼ぶ。
const getEventDetailForPage = cache(getEventDetailOrNull);

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
