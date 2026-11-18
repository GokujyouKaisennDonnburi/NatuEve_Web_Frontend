// ドキュメント応答に CSP ヘッダーを付ける proxy（Next.js 16 で middleware から改名）。
// nonce を毎リクエスト生成し、CSP を request ヘッダーに乗せると Next.js が
// レンダリングする script / style に同じ nonce を付けてくれる
// （docs: 01-app/02-guides/content-security-policy.md の「Adding a nonce with Proxy」）。

import { buildCspHeader, buildTrustedTypesCspHeader } from "@/lib/csp";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Report-Only かどうか。request / response のヘッダー名と buildCspHeader に渡し、
// Report-Only では無視される upgrade-insecure-requests を外すのに使う。
// 検証環境での違反観察（#416）のため、env で Report-Only に切り替えられる。
// Next.js の nonce 抽出は Report-Only のヘッダーも対象である（node_modules/next/
// dist/server/route-modules/app-page/parse-request-headers.js の
// parseRequestHeaders が content-security-policy と
// content-security-policy-report-only の両方を読む）ため、Report-Only 時でも
// script に nonce が付く。ただし content-security-policy を先に読むため、Workers で
// nonce のない #335 の CSP と並べると nonce が付かない（OpenNext が応答ヘッダーを
// リクエストにも写すため）。検証環境は #335 の CSP を外している（next.config.ts）。
const isReportOnly = () => process.env.CSP_REPORT_ONLY === "true";

const getCspHeaderKey = (reportOnly: boolean) =>
  reportOnly
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";

export function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  // uuid（16 進数とハイフン）を base64 に変換し、CSP の nonce 構文に合う文字列にする。
  const nonce = btoa(crypto.randomUUID());
  const reportOnly = isReportOnly();
  const cspHeader = buildCspHeader({
    nonce,
    isDev,
    isReportOnly: reportOnly,
  });
  const headerKey = getCspHeaderKey(reportOnly);
  // Trusted Types（#415）は nonce の CSP と別のヘッダーで、常に Report-Only にして観察する。
  // enforce の CSP に含めないのは、Turbopack のランタイムが Trusted Types に対応していない
  // （vercel/next.js#101261）ため、#412 の enforce 切替を上流の修正待ちで止めないため。
  // dev では buildTrustedTypesCspHeader が null を返し、ヘッダーを付けない。
  const trustedTypesCsp = buildTrustedTypesCspHeader({ isDev });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(headerKey, cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set(headerKey, cspHeader);
  // set ではなく append にする。CSP_REPORT_ONLY=true のときは nonce の CSP も同じ
  // ヘッダー名になるため、上書きすると観察中の CSP を消してしまう。最終の応答では
  // 同じ名前のヘッダーはカンマ区切りで 1 行に連結されて届き（ローカルの preview で実測）、
  // ブラウザはカンマ区切りの CSP を別々のポリシーとして両方とも Report-Only で評価する。
  if (trustedTypesCsp !== null) {
    response.headers.append(
      "Content-Security-Policy-Report-Only",
      trustedTypesCsp,
    );
  }

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
