import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import {
  developmentImageHosts,
  mockImageHosts,
  productionImageHosts,
  MOCK_STORAGE_ORIGIN,
} from "./src/lib/imageOrigins";
// 型の本体は src/lib/imageOrigins.ts。#335 の CSP で remotePatterns を CSP の
// ホストソースにするため、このファイルでも使う。
import type { ImageRemotePattern } from "./src/lib/imageOrigins";

// 画像の取得元（remotePatterns の一覧）は src/lib/imageOrigins.ts に置いている。
// #335 の CSP の img-src もこの一覧から組み立て、remotePatterns と CSP（enforce・Report-Only の両方）が
// ずれないようにする（ADR-0005 決定 1）。ここではフラグの判定と組み立てだけを行う。

// MSW を使うビルドでのみモック用の取得元を許可する。
// `true` 以外（未設定・`false` を含む）ではモック用を含めない（安全側のデフォルト）。
const isMswEnabled = process.env.NEXT_PUBLIC_USE_MSW === "true";

// ローカル開発・検証環境のビルドでのみ開発用の取得元を許可する。
// `true` 以外（未設定・`false` を含む）では含めない（安全側のデフォルト）。
const isDevAssetsEnabled = process.env.USE_DEV_ASSETS === "true";

// 画像最適化で許可する取得元。CSP の img-src も同じ一覧から組み立て、両者がずれないようにする。
const imageRemotePatterns: ImageRemotePattern[] = [
  ...productionImageHosts,
  ...(isDevAssetsEnabled ? developmentImageHosts : []),
  ...(isMswEnabled ? mockImageHosts : []),
];

// 検証環境のビルドでのみ、全ページを検索エンジンの登録対象から外す（#372）。
// `true` 以外（未設定・`false` を含む）では付けない（本番が検索から消えるのを防ぐ）。
const isSiteNoindex = process.env.SITE_NOINDEX === "true";

// 検証環境のビルドでのみ、#335 の CSP を外す（#416）。
// Workers では OpenNext が headers() の値をリクエストヘッダーにも写し、Next.js は nonce を
// Content-Security-Policy から Report-Only より先に探す。この CSP には nonce がないため、
// 残すと proxy の nonce が script に付かず、Report-Only で違反を観察できない。
// `true` 以外（未設定・`false` を含む）では外さない（本番の enforce を誤って外さないため）。
const isConfigCspDisabled = process.env.DISABLE_NEXT_CONFIG_CSP === "true";

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

// remotePatterns の取得元を CSP のホストソースにする。
// protocol が未設定なら、CSP でもスキームを省く（ページと同じスキームだけに一致する）。
// port は値があれば付け、"" と未設定では付けない（既定のポートだけに一致する）。未設定の remotePatterns は
// どのポートも許すが、CSP では広げない。img-src が効くのは直接読み込む画像だけで、画像最適化は 'self' で通るため。
// hostname のワイルドカード（** など）は CSP と書き方が違うため、使うときはここも直す。
const toImageSource = ({ protocol, hostname, port }: ImageRemotePattern) =>
  `${protocol ? `${protocol}://` : ""}${hostname}${port ? `:${port}` : ""}`;

// 本番ビルドで付ける CSP（#335）。
// Next.js はページにインラインスクリプトを埋め込むため script-src に 'unsafe-inline' が要る。
// nonce の CSP は ADR-0005 で採用を決めた。#412 で proxy（src/proxy.ts）の CSP に切り替えるまでは、本番ではこの CSP を使う（検証環境は外す。上の isConfigCspDisabled）。
// next/image の style 属性・sonner が差し込む <style> などのインラインのスタイルがあるため、style-src にも 'unsafe-inline' を付ける。
// 接続先は remotePatterns と同じくビルド時の環境変数から組み立てる（本番と検証環境で値が違う）。
// 開発時（next dev）は 'unsafe-eval' と HMR が要るため付けない。
const buildContentSecurityPolicy = (): string => {
  const imageSources = [
    "'self'",
    // アップロード前のプレビュー（URL.createObjectURL）。
    "blob:",
    // 本番用の events・reports のように、ホストが同じ取得元は 1 つにまとめる。
    ...new Set(imageRemotePatterns.map(toImageSource)),
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
    ...(isMswEnabled ? [MOCK_STORAGE_ORIGIN] : []),
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

// HSTS（#386）。静的ファイルには public/_headers で同じ値を付ける。
// includeSubDomains はこのホストの下位（*.natueve-web.natuportal.org）にだけ効き、natuportal.org のほかのサブドメインには効かない。
// preload は付けない（登録は apex の natuportal.org で行うもので、NatuPortal の全サブドメインに効くため）。
// ブラウザに覚えられると max-age が切れるまで取り消せないため、5 分で確かめてから 1 年に延ばす（docs/Deployment.md「HSTS」）。
// 開発時（next dev）は付けない（localhost を HTTPS で開いたときに、ほかの開発中のサイトまで HTTPS に固定されないようにする）。
const strictTransportSecurityHeader = {
  key: "Strict-Transport-Security",
  value: "max-age=300; includeSubDomains",
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
  async headers() {
    const securityHeaders = [
      ...commonSecurityHeaders,
      ...(process.env.NODE_ENV === "production"
        ? [
            strictTransportSecurityHeader,
            ...(isConfigCspDisabled
              ? []
              : [
                  {
                    key: "Content-Security-Policy",
                    value: buildContentSecurityPolicy(),
                  },
                ]),
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
    remotePatterns: imageRemotePatterns,
  },
};

export default nextConfig;

// ローカル開発でCloudflareのバインディングを使うための初期化
initOpenNextCloudflareForDev();
