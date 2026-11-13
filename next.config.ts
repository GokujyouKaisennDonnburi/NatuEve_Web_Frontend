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
// モックの画像 URL を変えるときは、ホストをここに追加して URL と許可リストを揃える。
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
// `true` 以外（未設定・`false` を含む）ではモック用を含めない（安全側のデフォルト）。
const isMswEnabled = process.env.NEXT_PUBLIC_USE_MSW === "true";

// ローカル開発・検証環境のビルドでのみ開発用の取得元を許可する。
// `true` 以外（未設定・`false` を含む）では含めない（安全側のデフォルト）。
const isDevAssetsEnabled = process.env.USE_DEV_ASSETS === "true";

// 検証環境のビルドでのみ、全ページを検索エンジンの登録対象から外す（#372）。
// `true` 以外（未設定・`false` を含む）では付けない（本番が検索から消えるのを防ぐ）。
const isSiteNoindex = process.env.SITE_NOINDEX === "true";

// 環境変数の URL からオリジンを取り出す。未設定・空文字なら何も返さない
// （CI の品質チェックのビルドは接続先を空で渡す）。値が http(s) の URL でなければビルドを止める。
const toOrigins = (name: string, value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  const url = URL.parse(value);

  // "localhost:8085" のようにスキームが抜けた値も URL として解釈され、オリジンが "null" になるため弾く。
  if (url?.protocol !== "https:" && url?.protocol !== "http:") {
    throw new Error(`${name} が URL ではありません。`);
  }

  return [url.origin];
};

const toImageSources = (patterns: ImageRemotePattern[]): string[] => [
  ...new Set(
    patterns.map(({ protocol, hostname }) => `${protocol}://${hostname}`),
  ),
];

// 本番ビルドで付ける CSP（#335）。
// Next.js はページにインラインスクリプトを埋め込むため script-src に 'unsafe-inline' が要る。
// nonce にすると全ページが毎回の動的レンダリングになり ISR・静的ページを使えないため、使わない。
// next/image の style 属性・sonner が差し込む <style> などのインラインのスタイルがあるため、style-src にも 'unsafe-inline' を付ける。
// 接続先は remotePatterns と同じくビルド時の環境変数から組み立てる（本番と検証環境で値が違う）。
// 開発時（next dev）は 'unsafe-eval' と HMR が要るため付けない。
const buildContentSecurityPolicy = (): string => {
  const imageSources = [
    "'self'",
    // アップロード前のプレビュー（URL.createObjectURL）。
    "blob:",
    ...toImageSources([
      ...productionImageHosts,
      ...(isDevAssetsEnabled ? developmentImageHosts : []),
      ...(isMswEnabled ? mockImageHosts : []),
    ]),
    // アバター（Supabase の user_metadata の Google のプロフィール画像。画像最適化を通さない）。
    "https://lh3.googleusercontent.com",
  ];

  const connectSources = [
    "'self'",
    ...toOrigins(
      "NEXT_PUBLIC_API_BASE_URL",
      process.env.NEXT_PUBLIC_API_BASE_URL,
    ),
    ...toOrigins(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    // 画像・PDF を presign の署名付き URL へ直接 PUT する（NatuEve_API の internal/storage/r2.go）。
    // ホストはアカウント ID を含むが、ビルドに渡す変数を増やさないためワイルドカードにする。
    "https://*.r2.cloudflarestorage.com",
    // MSW のモックの署名付き URL（src/mocks/handlers/uploads.ts）。
    ...(isMswEnabled ? ["https://mock.storage.test"] : []),
  ];

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imageSources.join(" ")}`,
    "font-src 'self'",
    `connect-src ${connectSources.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
};

// ページと静的ファイルの両方に付けるヘッダー（#335）。静的ファイルには public/_headers で同じ値を付ける。
// X-Frame-Options は frame-ancestors を解さない古いブラウザ向け。
const commonSecurityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

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
  async headers() {
    const securityHeaders = [
      ...commonSecurityHeaders,
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              key: "Content-Security-Policy",
              value: buildContentSecurityPolicy(),
            },
          ]
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
