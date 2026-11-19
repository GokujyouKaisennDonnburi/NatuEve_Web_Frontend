import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import {
  developmentImageHosts,
  mockImageHosts,
  productionImageHosts,
} from "./src/lib/imageOrigins";
import type { ImageRemotePattern } from "./src/lib/imageOrigins";

// 画像の取得元（remotePatterns の一覧）は src/lib/imageOrigins.ts に置いている。
// proxy の CSP（src/lib/csp.ts）の img-src も同じモジュールの取得元から組み立て、
// remotePatterns と CSP がずれないようにする（ADR-0005 決定 1）。ここではフラグの判定と組み立てだけを行う。
// CSP は proxy（src/proxy.ts）だけが付け、このファイルでは付けない（#412。ADR-0005 決定 3）。

// MSW を使うビルドでのみモック用の取得元を許可する。
// `true` 以外（未設定・`false` を含む）ではモック用を含めない（安全側のデフォルト）。
const isMswEnabled = process.env.NEXT_PUBLIC_USE_MSW === "true";

// ローカル開発・検証環境のビルドでのみ開発用の取得元を許可する。
// `true` 以外（未設定・`false` を含む）では含めない（安全側のデフォルト）。
const isDevAssetsEnabled = process.env.USE_DEV_ASSETS === "true";

// 画像最適化で許可する取得元。CSP の img-src は proxy が同じモジュールの取得元から組み立てる。
const imageRemotePatterns: ImageRemotePattern[] = [
  ...productionImageHosts,
  ...(isDevAssetsEnabled ? developmentImageHosts : []),
  ...(isMswEnabled ? mockImageHosts : []),
];

// 検証環境のビルドでのみ、全ページを検索エンジンの登録対象から外す（#372）。
// `true` 以外（未設定・`false` を含む）では付けない（本番が検索から消えるのを防ぐ）。
const isSiteNoindex = process.env.SITE_NOINDEX === "true";

// ページと静的ファイルの両方に付けるヘッダー（#335）。静的ファイルには public/_headers で同じ値を付ける。
// X-Frame-Options は frame-ancestors を解さない古いブラウザ向け。
const commonSecurityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

// HSTS（#386）。静的ファイルには public/_headers で同じ値を付ける。
// includeSubDomains はこのホストの下位（*.natueve-web.natuportal.org）にだけ効き、natuportal.org のほかのサブドメインには効かない。
// preload は付けない（登録は apex の natuportal.org で行うもので、NatuPortal の全サブドメインに効くため）。
// 段階 1（5 分）を検証環境・本番で確かめてから、段階 2 の 1 年にした（#411。docs/Deployment.md「HSTS」）。
// ブラウザに覚えられると max-age が切れるまで取り消せないため、戻すときは max-age=0 を返す（同「戻し方」）。
// 開発時（next dev）は付けない（localhost を HTTPS で開いたときに、ほかの開発中のサイトまで HTTPS に固定されないようにする）。
const strictTransportSecurityHeader = {
  key: "Strict-Transport-Security",
  value: "max-age=31536000; includeSubDomains",
};

// Next.jsの設定ファイル
const nextConfig: NextConfig = {
  reactStrictMode: true,

  experimental: {
    optimizeCss: true,
  },

  async rewrites() {
    // 開発時のみ /api をローカルのAPIサーバーへ転送する。
    // 本番ビルドでは空を返し、APIはNEXT_PUBLIC_API_BASE_URLへ直接呼ぶ。
    if (process.env.NODE_ENV !== "development") {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8085/api/:path*",
      },
    ];
  },

  // Workers では静的アセットと /_next/image は headers() を通らないため付かない。
  // 静的アセットのセキュリティヘッダーは public/_headers で補う。
  // CSP はここでは付けない。Workers では OpenNext がここのヘッダーを Next.js に渡すリクエストにも写し、
  // Next.js は nonce を Content-Security-Policy から読むため、nonce のない CSP を足すと proxy の nonce が
  // script に付かなくなる（#416。docs/Deployment.md「CSP」）。
  async headers() {
    const securityHeaders = [
      ...commonSecurityHeaders,
      ...(process.env.NODE_ENV === "production"
        ? [strictTransportSecurityHeader]
        : []),
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // metadata の設定に左右されないよう、レスポンスヘッダーで付ける。
      // robots.txt の Disallow にはしない（クロールされないと noindex が読まれないため）。
      ...(isSiteNoindex
        ? [
            {
              source: "/:path*",
              headers: [{ key: "X-Robots-Tag", value: "noindex" }],
            },
          ]
        : []),
    ];
  },

  // 画像のリモートパターン設定
  images: {
    remotePatterns: imageRemotePatterns,
  },
};

export default nextConfig;

// ローカル開発でCloudflareのバインディングを使うための初期化
initOpenNextCloudflareForDev();
