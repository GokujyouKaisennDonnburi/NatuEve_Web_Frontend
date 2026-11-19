// CSP ヘッダーの中身を組み立てる純粋関数。
// src/proxy.ts から呼び出す。単体テストで env を差し替えて検証できるよう、
// 環境変数はこの関数の実行時に読む。

import {
  DEVELOPMENT_ASSETS_ORIGIN,
  GOOGLE_PROFILE_IMAGE_ORIGIN,
  MOCK_IMAGE_ORIGINS,
  MOCK_STORAGE_ORIGIN,
  PRODUCTION_ASSETS_ORIGIN,
} from "./imageOrigins";

// presign が返す署名付き PUT の宛先（R2 の S3 API エンドポイント）。
// アカウント ID はフロントからは不明のため、ドメイン全体を許可する。
// ほかのアカウントの R2 にも一致し、スクリプトが動けば持ち出し先になりうるが、#412 で絞らないと決めた。
// nonce の CSP（enforce）で差し込まれたスクリプトはそもそも動かず、動いた場合もページの移動など
// CSP で止められない持ち出し方が残るため、絞る手間とアップロードが壊れる危険に見合わない（ADR-0005）。
const R2_STORAGE_ENDPOINT_SOURCE = "https://*.r2.cloudflarestorage.com";

const isFlagEnabled = (value: string | undefined) => value === "true";

// env の URL を CSP に書けるオリジンへ変換する。
// 未設定・壊れた値は CSP に含めず無視する。その接続先は CSP でブロックされ、
// 問題はブラウザの Console に現れる（無効な値で proxy を落とさないため）。
// data: など非階層スキームは例外にならないため、origin の文字列 "null" も除外する。
const toOrigin = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }
  let origin: string;
  try {
    origin = new URL(value).origin;
  } catch {
    return null;
  }
  return origin === "null" ? null : origin;
};

export type CspBuildOptions = {
  nonce: string;
  isDev: boolean;
  isReportOnly?: boolean;
};

// CSP を「ディレクティブ ソース」の並びとして組み立てる。
// script-src は nonce + 'strict-dynamic' とする。'self' は strict-dynamic 非対応の
// 古いブラウザ向けの後方互換用で、対応ブラウザでは無視される。
// dev は React がデバッグ情報の再構築に eval を使うため 'unsafe-eval' が必要だが、
// 本番では React・Next.js とも eval を使わないため含めない（#383 の AC）。
// style-src の 'unsafe-inline' は Next.js が生成する style 要素と React の style 属性の
// ため必要で、禁止しているのは script-src だけである。
export function buildCspHeader({
  nonce,
  isDev,
  isReportOnly,
}: CspBuildOptions): string {
  // USE_DEV_ASSETS・CSP_REPORT_ONLY は Worker の実行時変数で、wrangler.jsonc の
  // vars で渡す（本番は最上位、検証は env.staging。vars は env に引き継がれないため
  // env.staging でも宣言する）。OpenNext の populateProcessEnv が文字列のバインディングを
  // process.env に供給するため、ここで読める。
  // CI のワークフローの env: の値はビルド時にしか届かない。next-env.mjs に入るのは
  // .env 系ファイルの値だけ（CI は .env を使わない）ため、この経路には依らない
  // （docs/Deployment.md「Worker の実行時変数」）。
  //
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
    // MSW のモックの署名付き URL の直 PUT 先（src/mocks/handlers/uploads.ts）。
    ...(isFlagEnabled(process.env.NEXT_PUBLIC_USE_MSW)
      ? [MOCK_STORAGE_ORIGIN]
      : []),
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
    // Report-Only では upgrade-insecure-requests が無視され、Console に警告が出るため
    // Report-Only のときは付けない（#416 で Console を見るときに紛らわしくないようにする）。
    ...(isReportOnly ? [] : ["upgrade-insecure-requests"]),
  ];

  return directives.join("; ");
}

// Trusted Types のヘッダーの中身を組み立てる純粋関数（#415）。
// nonce の CSP とは別のヘッダーとして、常に Report-Only で付ける。
// enforce の nonce の CSP（buildCspHeader）に含めないのは、Turbopack の
// ランタイムがチャンク読み込みの script.src に文字列を直接代入していて
// （vercel/next.js#101261。2026-11-16 時点で修正はリリースされていない）、強制すると
// ページ間の移動・先読みが止まるため。
// Report-Only のヘッダーで観察を続け、上流が直った後に enforce の CSP へ統合するかを決める。
// dev では null を返し、ヘッダー自体を付けない（#415 の AC）。React DevTools など
// 開発ツールがシンクを使うため、違反で開発が止まるのを避ける。
// trusted-types はポリシー名の許可リスト。Next.js のランタイムが作るポリシー名は
// nextjs である（node_modules/next/dist/client/trusted-types.js の getPolicy）。
// ライブラリ内部でほかの名前のポリシーを作る違反が出たら、ここに名前を足す。
export function buildTrustedTypesCspHeader({
  isDev,
}: {
  isDev: boolean;
}): string | null {
  if (isDev) {
    return null;
  }
  return "require-trusted-types-for 'script'; trusted-types nextjs";
}
