import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// テストでも同じ型を使い、Next.js 側の型変更に追従する。
export type ImageRemotePattern = NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
>[number];

const assetHostname = "assets.natuportal.org";
const developmentAssetHostname = "assets-dev.natuportal.org";

// 本番でも使う画像の取得元（R2 の公開ドメイン）。
// 画像最適化で変換できる画像を、API が保存するイベント・レポートの画像だけに絞る（#351）。
// キーは NatuEve_API の buildFinalKey（natueve/{events|reports}/images/{uuid}{.jpg|.png}）に合わせる。
// ファイル名を UUID の文字（小文字の 16 進数とハイフン）と拡張子に限り、%2F などのエンコードした区切りも通さない。
// 一時領域（natueve/tmp/）・PDF（natueve/*/documents/）・他プロダクトの画像は許可しない。
// API の URL にはクエリが付かないため、search: "" でクエリ付きの URL も許可しない。
// port: "" で既定のポート（443）だけを許可する（Cloudflare は 8443 などの HTTPS の別ポートでも応答するため）。
// Google のプロフィール画像（lh3.googleusercontent.com）は unoptimized で表示し、ここには含めない。
const productionImageHosts: ImageRemotePattern[] = ["events", "reports"].map(
  (destination) => ({
    protocol: "https",
    hostname: assetHostname,
    port: "",
    pathname: `/natueve/${destination}/images/+([0-9a-f-]).@(jpg|png)`,
    search: "",
  }),
);

// ローカル開発・検証環境用の R2 の公開ドメイン（NatuEve_API ADR-0039）。
// 本番のビルド環境ではフラグを設定しない。キーの形式は本番と同じため、本番と同じ制限を引き継ぐ。
const developmentImageHosts: ImageRemotePattern[] = productionImageHosts.map(
  (pattern) => ({
    ...pattern,
    hostname: developmentAssetHostname,
  }),
);

// MSW のモックデータ（src/mocks/**・src/services/mockAuth.ts）でのみ使う画像の取得元。
// i.pravatar.cc のアバターは next/image の unoptimized で表示するため、ここには含めない。
// モックの画像 URL を変えるときは、ホストと pathname をここに追加して URL と許可リストを揃える。
// search は画像の切り替えに使うため制限しない。
const mockImageHosts: ImageRemotePattern[] = [
  {
    protocol: "https",
    hostname: "picsum.photos",
    pathname: "/+([0-9])/+([0-9])",
  },
];

// モック用の取得元は、MSW を使うビルドと開発環境でのみ許可する。
// 本番ビルドでは `true` 以外（未設定・`false` を含む）ならモック用を含めない（安全側のデフォルト）。
// 開発サーバは起動後に `.env.local` を変更しても next.config.ts を再評価しない。
// 開発サーバは外部公開しない前提のため、MSW の有効化タイミングに関係なく許可する。
const isMockImageHostsEnabled =
  process.env.NEXT_PUBLIC_USE_MSW === "true" ||
  process.env.NODE_ENV === "development";

// ローカル開発・検証環境のビルドでのみ開発用の取得元を許可する。
// `true` 以外（未設定・`false` を含む）では含めない（安全側のデフォルト）。
const isDevAssetsEnabled = process.env.USE_DEV_ASSETS === "true";

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
    remotePatterns: [
      ...productionImageHosts,
      ...(isDevAssetsEnabled ? developmentImageHosts : []),
      ...(isMockImageHostsEnabled ? mockImageHosts : []),
    ],
  },
};

export default nextConfig;

// ローカル開発でCloudflareのバインディングを使うための初期化
initOpenNextCloudflareForDev();
