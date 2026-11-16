import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import {
  developmentImageHosts,
  mockImageHosts,
  productionImageHosts,
} from "./src/lib/imageOrigins";

// 画像の取得元（remotePatterns の一覧）は src/lib/imageOrigins.ts に置いている。
// CSP の img-src・connect-src（src/lib/csp.ts）と共通の一覧にするため、
// ここではフラグの判定と組み立てだけを行う。

// MSW を使うビルドでのみモック用の取得元を許可する。
// `true` 以外（未設定・`false` を含む）ではモック用を含めない（安全側のデフォルト）。
const isMswEnabled = process.env.NEXT_PUBLIC_USE_MSW === "true";

// ローカル開発・検証環境のビルドでのみ開発用の取得元を許可する。
// `true` 以外（未設定・`false` を含む）では含めない（安全側のデフォルト）。
const isDevAssetsEnabled = process.env.USE_DEV_ASSETS === "true";

// 検証環境のビルドでのみ、全ページを検索エンジンの登録対象から外す（#372）。
// `true` 以外（未設定・`false` を含む）では付けない（本番が検索から消えるのを防ぐ）。
const isSiteNoindex = process.env.SITE_NOINDEX === "true";

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

  // metadata の設定に左右されないよう、レスポンスヘッダーで付ける。
  // Workers では静的アセットと /_next/image は headers() を通らないため付かない。
  // robots.txt の Disallow にはしない（クロールされないと noindex が読まれないため）。
  async headers() {
    if (!isSiteNoindex) {
      return [];
    }

    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },

  // 画像のリモートパターン設定
  images: {
    remotePatterns: [
      ...productionImageHosts,
      ...(isDevAssetsEnabled ? developmentImageHosts : []),
      ...(isMswEnabled ? mockImageHosts : []),
    ],
  },
};

export default nextConfig;

// ローカル開発でCloudflareのバインディングを使うための初期化
initOpenNextCloudflareForDev();
