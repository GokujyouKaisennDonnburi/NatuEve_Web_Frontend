import { SITE_URL } from "@/constants/config";
import { ROUTES } from "@/constants/routes";
import { getSitemapEvents } from "@/services/event";
import type { MetadataRoute } from "next";

// ビルド時のプリレンダリングを避け、リクエストごとに API を呼ぶ。
// revalidate だとビルド時に API を呼ぶため、API URL が空の CI でビルドが失敗する。
export const dynamic = "force-dynamic";

// sitemap 1 ファイルあたりの URL 数の上限（プロトコル仕様）。
const MAX_SITEMAP_URLS = 50_000;

const STATIC_PATHS = [
  ROUTES.ABOUT,
  ROUTES.GUIDELINE,
  ROUTES.DOCS,
  ROUTES.EVENT_LIST,
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 失敗時は例外を伝播させ、部分的な sitemap を返さず 500 にする。
  const events = await getSitemapEvents();

  // API は updatedAt の降順で返すため、先頭を残して古いものから落とす。
  const limitedEvents = events.slice(0, MAX_SITEMAP_URLS - STATIC_PATHS.length);

  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...limitedEvents.map((event) => ({
      url: `${SITE_URL}/event/${encodeURIComponent(event.id)}`,
      lastModified: event.updatedAt,
    })),
  ];
}
