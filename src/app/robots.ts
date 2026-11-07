import { SITE_URL } from "@/constants/config";
import type { MetadataRoute } from "next";

// 検索に載せないページは Disallow にせず noindex で制御する。
// Disallow するとクロールされず、noindex が読まれなくなる。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
