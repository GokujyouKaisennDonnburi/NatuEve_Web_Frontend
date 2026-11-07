import type { EventDetailResponse } from "@/types/event";
import { canonicalMetadata } from "@/utils/metadata";
import type { Metadata } from "next";

const DESCRIPTION_MAX_LENGTH = 120;
const DESCRIPTION_SEGMENTER = new Intl.Segmenter("ja", {
  granularity: "grapheme",
});

// メタディスクリプション用に、説明文の改行・連続空白を1つの空白へ正規化し、
// 長すぎる場合は冒頭のみを切り出す。
export function buildEventDescription(description: string): string | undefined {
  const normalized = description.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return undefined;
  }

  // 絵文字の ZWJ シーケンスや結合文字を途中で切らないよう、書記素単位で分割する。
  const segments = Array.from(
    DESCRIPTION_SEGMENTER.segment(normalized),
    ({ segment }) => segment,
  );

  return segments.length > DESCRIPTION_MAX_LENGTH
    ? `${segments.slice(0, DESCRIPTION_MAX_LENGTH - 1).join("")}…`
    : normalized;
}

// イベントごとの title / description と OGP を組み立てる。
// 子の openGraph は親を置き換えるため、canonicalMetadata のサイト共通の値と og:url も含める。
// X カードの title・description・画像は openGraph から引き継がれる。
export function buildEventMetadata(
  event: Pick<
    EventDetailResponse,
    "id" | "title" | "description" | "imageUrls"
  >,
): Metadata {
  const description = buildEventDescription(event.description);
  const { alternates, openGraph } = canonicalMetadata(
    `/event/${encodeURIComponent(event.id)}`,
  );
  const descriptionMetadata = description ? { description } : {};
  const firstImageUrl = event.imageUrls?.[0];

  return {
    title: event.title,
    ...descriptionMetadata,
    // 非正規の URL で開かれても、canonical と og:url を API の ID にそろえる。
    alternates,
    openGraph: {
      ...openGraph,
      title: event.title,
      ...descriptionMetadata,
      // 画像がないイベントは openGraph の既定の OGP 画像のままにする。
      ...(firstImageUrl
        ? { images: [{ url: firstImageUrl, alt: event.title }] }
        : {}),
    },
  };
}
