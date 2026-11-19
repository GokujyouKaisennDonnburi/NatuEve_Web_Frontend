// 画像の取得元の設定を 1 か所にまとめたモジュール。
// next.config.ts（/_next/image の images.remotePatterns。ビルド時に参照）と
// src/lib/csp.ts（CSP の img-src・connect-src。Worker の実行時に参照）の両方から
// 使う。一覧を 2 か所に分けると、片方だけ変えたときに画像が止まるため
// （ADR-0005 決定 1）、ホスト名と取得元の定義をここに置く。
// next.config.ts は読み込み時に initOpenNextCloudflareForDev() を呼ぶため、
// proxy（Worker のバンドル）からは next.config.ts を import しない。
// このモジュールは next.config.ts から import して共有する。

import type { NextConfig } from "next";

// テストでも同じ型を使い、Next.js 側の型変更に追従する。
export type ImageRemotePattern = NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
>[number];

// 画像・ファイルの取得元（R2 の公開ドメイン。NatuEve_API ADR-0039 / ADR-0040）。
// CSP の img-src・connect-src には origin の形で、remotePatterns には hostname の
// 形で使う。
export const ASSETS_HOSTNAME = "assets.natuportal.org";
export const DEVELOPMENT_ASSETS_HOSTNAME = "assets-dev.natuportal.org";

export const PRODUCTION_ASSETS_ORIGIN = `https://${ASSETS_HOSTNAME}`;
export const DEVELOPMENT_ASSETS_ORIGIN = `https://${DEVELOPMENT_ASSETS_HOSTNAME}`;

// Google のプロフィール画像。unoptimized で直接表示するため remotePatterns には
// 含めない。CSP の img-src だけに載る。
export const GOOGLE_PROFILE_IMAGE_ORIGIN = "https://lh3.googleusercontent.com";

// MSW のモックデータでのみ使う画像の取得元。
// モックの画像 URL を変えるときは、ホストをここに追加して URL と許可リストを揃える。
export const MOCK_IMAGE_ORIGINS = [
  "https://picsum.photos",
  "https://i.pravatar.cc",
];

// MSW 内で presign が返すダミー R2 のドメイン（src/mocks/handlers/uploads.ts）。
// モックの presign が返す URL を変えるときに直し忘れると、MSW モードで
// アップロードの PUT が CSP にブロックされるため、CSP（src/lib/csp.ts）と 1 つの定数を共有する。このモジュールはランタイム依存のない
// 純粋な定数だけを持つため、uploads.ts（msw を同梱する）からも import できる。
export const MOCK_STORAGE_ORIGIN = "https://mock.storage.test";

// 本番でも使う画像の取得元（R2 の公開ドメイン）。
// 画像最適化で変換できる画像を、API が保存するイベント・レポートの画像だけに絞る（#351）。
// キーは NatuEve_API の buildFinalKey（natueve/{events|reports}/images/{uuid}{.jpg|.png}）に合わせる。
// ファイル名を UUID の文字（小文字の 16 進数とハイフン）と拡張子に限り、%2F などのエンコードした区切りも通さない。
// 一時領域（natueve/tmp/）・PDF（natueve/*/documents/）・他プロダクトの画像は許可しない。
// API の URL にはクエリが付かないため、search: "" でクエリ付きの URL も許可しない。
// port: "" で既定のポート（443）だけを許可する（Cloudflare は 8443 などの HTTPS の別ポートでも応答するため）。
export const productionImageHosts: ImageRemotePattern[] = [
  "events",
  "reports",
].map((destination) => ({
  protocol: "https",
  hostname: ASSETS_HOSTNAME,
  port: "",
  pathname: `/natueve/${destination}/images/+([0-9a-f-]).@(jpg|png)`,
  search: "",
}));

// ローカル開発・検証環境用の R2 の公開ドメイン（NatuEve_API ADR-0039）。
// 本番のビルド環境ではフラグを設定しない。キーの形式は本番と同じため、本番と同じ制限を引き継ぐ。
export const developmentImageHosts: ImageRemotePattern[] =
  productionImageHosts.map((pattern) => ({
    ...pattern,
    hostname: DEVELOPMENT_ASSETS_HOSTNAME,
  }));

// MSW を使うビルドでのみモック用の取得元を許可する。
// `true` 以外（未設定・`false` を含む）ではモック用を含めない（安全側のデフォルト）。
export const mockImageHosts: ImageRemotePattern[] = [
  {
    protocol: "https",
    hostname: "picsum.photos",
  },
  {
    protocol: "https",
    hostname: "i.pravatar.cc",
  },
];
