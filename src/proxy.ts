// ドキュメント応答に CSP ヘッダーを付ける proxy（Next.js 16 で middleware から改名）。
// nonce を毎リクエスト生成し、CSP を request ヘッダーに乗せると Next.js が
// レンダリングする script / style に同じ nonce を付けてくれる
// （docs: 01-app/02-guides/content-security-policy.md の「Adding a nonce with Proxy」）。

import { buildCspHeader } from "@/lib/csp";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 検証環境での違反観察（#416）のため、env で Report-Only に切り替えられる。
// request 側のヘッダー名も揃える。Next.js の nonce 抽出は Report-Only のヘッダーも
// 対象である（node_modules/next/dist/server/route-modules/app-page/parse-request-headers.js
// の parseRequestHeaders が content-security-policy と content-security-policy-report-only
// の両方を読む）ため、Report-Only 時でも script に nonce が付く。
const getCspHeaderKey = () =>
  process.env.CSP_REPORT_ONLY === "true"
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";

export function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  // uuid（16 進数とハイフン）を base64 に変換し、CSP の nonce 構文に合う文字列にする。
  const nonce = btoa(crypto.randomUUID());
  const cspHeader = buildCspHeader({ nonce, isDev });
  const headerKey = getCspHeaderKey();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(headerKey, cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set(headerKey, cspHeader);

  return response;
}

export const config = {
  matcher: [
    {
      // ドキュメント以外（静的アセット・画像最適化・API・メタデータルート・
      // MSW の Service Worker スクリプト）には CSP が不要なため除外する。
      // 本番では静的アセットは Workers の assets レイヤが Worker をバイパスするため、
      // そもそも proxy を通らない。
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|mockServiceWorker.js).*)",
      // next/link の prefetch 応答はドキュメントではないため除外する（docs の推奨）。
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
