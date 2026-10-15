import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

type ImageRemotePattern = NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
>[number];

// 本番でも使う画像の取得元（R2 の公開ドメイン、Google のプロフィール画像）
const productionImageHosts: ImageRemotePattern[] = [
  {
    protocol: "https",
    hostname: "assets.natuportal.org",
  },
  {
    protocol: "https",
    hostname: "lh3.googleusercontent.com",
  },
];

// MSW のモックデータでのみ使う画像の取得元
const mockImageHosts: ImageRemotePattern[] = [
  {
    protocol: "https",
    hostname: "picsum.photos",
  },
  {
    protocol: "https",
    hostname: "i.pravatar.cc",
  },
];

// MSW を使うビルドでのみモック用の取得元を許可する。
// 未設定・false（本番ビルド）ではモック用を含めない（安全側のデフォルト）。
const isMswEnabled = process.env.NEXT_PUBLIC_USE_MSW === "true";

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

  // 画像のリモートパターン設定
  images: {
    remotePatterns: isMswEnabled
      ? [...productionImageHosts, ...mockImageHosts]
      : productionImageHosts,
  },
};

export default nextConfig;

// ローカル開発でCloudflareのバインディングを使うための初期化
initOpenNextCloudflareForDev();
