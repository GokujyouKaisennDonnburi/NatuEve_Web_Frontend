// CSP ヘッダーの中身を組み立てる純粋関数。
// src/proxy.ts から呼び出す。単体テストで env を差し替えて検証できるよう、
// 環境変数はこの関数の実行時に読む。

// 画像・ファイルの取得元（R2 の公開ドメイン。NatuEve_API ADR-0039 / ADR-0040）。
// next.config.ts の assetHostname / developmentAssetHostname と同じ値のため、
// 変更するときは next.config.ts と同期する。
const PRODUCTION_ASSETS_ORIGIN = "https://assets.natuportal.org";
const DEVELOPMENT_ASSETS_ORIGIN = "https://assets-dev.natuportal.org";

// Google のプロフィール画像。unoptimized で直接表示する（next.config.ts のコメント参照）。
const GOOGLE_PROFILE_IMAGE_ORIGIN = "https://lh3.googleusercontent.com";

// MSW のモックデータでのみ使う画像の取得元。
// next.config.ts の mockImageHosts と同じ値のため、変更するときは同期する。
const MOCK_IMAGE_ORIGINS = ["https://picsum.photos", "https://i.pravatar.cc"];

// presign が返す署名付き PUT の宛先（R2 の S3 API エンドポイント）。
// アカウント ID はフロントからは不明のため、ドメイン全体を許可する。
const R2_STORAGE_ENDPOINT_SOURCE = "https://*.r2.cloudflarestorage.com";

const isFlagEnabled = (value: string | undefined) => value === "true";

// env の URL を CSP に書けるオリジンへ変換する。
// 未設定・壊れた値は CSP に含めず無視する。その接続先は CSP でブロックされ、
// 問題はブラウザの Console に現れる（無効な値で proxy を落とさないため）。
const toOrigin = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

export type CspBuildOptions = {
  nonce: string;
  isDev: boolean;
};

// CSP を「ディレクティブ ソース」の並びとして組み立てる。
// script-src は nonce + 'strict-dynamic' とする。'self' は strict-dynamic 非対応の
// 古いブラウザ向けの後方互換用で、対応ブラウザでは無視される。
// dev は React がデバッグ情報の再構築に eval を使うため 'unsafe-eval' が必要だが、
// 本番では React・Next.js とも eval を使わないため含めない（#383 の AC）。
// style-src の 'unsafe-inline' は Next.js が生成する style 要素と React の style 属性の
// ため必要で、禁止しているのは script-src だけである。
export function buildCspHeader({ nonce, isDev }: CspBuildOptions): string {
  // R2 の公開ドメイン。画像の表示元であり、presign で発行した署名付き URL への
  // 直 PUT（画像/PDF の投稿）の宛先でもある。
  const r2Origins = [
    PRODUCTION_ASSETS_ORIGIN,
    ...(isFlagEnabled(process.env.USE_DEV_ASSETS)
      ? [DEVELOPMENT_ASSETS_ORIGIN]
      : []),
  ];

  // 画像の取得元。R2 の公開ドメインのほか、Google のプロフィール画像・MSW のモック画像、
  // 添付ファイルのプレビューに使う blob URL（FileDropZone / MultiFileField）を許可する。
  const imageOrigins = [
    ...r2Origins,
    GOOGLE_PROFILE_IMAGE_ORIGIN,
    ...(isFlagEnabled(process.env.NEXT_PUBLIC_USE_MSW)
      ? MOCK_IMAGE_ORIGINS
      : []),
  ];

  // API と Supabase（認証）はブラウザから直接 fetch する。
  // presign が返す署名付き PUT の宛先は R2 の S3 API エンドポイント
  // （https://{アカウントID}.r2.cloudflarestorage.com。NatuEve_API internal/storage/r2.go）で、
  // 公開ドメインとは異なる。フロントからはアカウント ID を組み立てられないため、
  // R2 の API ドメインで許可する（services/upload.ts の putToR2 が直接 PUT する）。
  const connectOrigins = [
    ...r2Origins,
    R2_STORAGE_ENDPOINT_SOURCE,
    toOrigin(process.env.NEXT_PUBLIC_API_BASE_URL),
    toOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL),
  ].filter((origin) => origin !== null);

  const connectSources = [
    "'self'",
    ...connectOrigins,
    ...(isDev ? ["ws:", "wss:"] : []),
  ];

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${imageOrigins.join(" ")}`,
    "font-src 'self'",
    `connect-src ${connectSources.join(" ")}`,
    ...(isDev ? ["worker-src 'self'"] : []),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // iframe 埋め込み（クリックジャッキング）を拒否する（#384 は XFO を別途設定する）。
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}
