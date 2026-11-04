import { APP_NAME, DEFAULT_OG_IMAGE } from "@/constants/config";
import type { Metadata } from "next";

// サイト共通の OGP。title・description は書かない（書くと全ページで固定され、各ページの metadata から引き継がれなくなる）。
// openGraph は親子でマージされず、子で設定すると親の値がすべて消えるため、子で設定するときはこれを展開する。
export const SITE_OPEN_GRAPH = {
  siteName: APP_NAME,
  locale: "ja_JP",
  type: "website",
  images: [DEFAULT_OG_IMAGE],
} satisfies Metadata["openGraph"];

// ページの正規 URL を canonical と og:url に出す。path は metadataBase からの相対パス。
export const canonicalMetadata = (
  path: string,
): Pick<Metadata, "alternates" | "openGraph"> => ({
  alternates: { canonical: path },
  openGraph: { ...SITE_OPEN_GRAPH, url: path },
});
