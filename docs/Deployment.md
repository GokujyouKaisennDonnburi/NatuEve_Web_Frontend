# デプロイ構成（フロントエンド）

NatuEve_Web_Frontend の本番デプロイ構成をまとめる。
構成を選んだ理由と退けた代替案は [ADR-0001](./adr/0001-deploy-cloudflare-workers-opennext.md) を参照。
料金・仕様は 2026-10 時点で各公式ページを確認した値（出典は末尾）。
バックエンド（API）の構成は NatuEve_API リポジトリの `docs/Deployment.md` を参照。

## 使用するサービス

| サービス | 用途 | 状態 |
|---|---|---|
| **Cloudflare Workers（Paid プラン）** | Next.js の SSR と静的ファイルの配信 | 確定 |
| **OpenNext（`@opennextjs/cloudflare`）** | Next.js を Workers で動かすためのアダプタ | 確定 |
| Cloudflare DNS | 独自ドメインの割り当て（`natuportal.org` のサブドメイン） | 予定（サブドメイン名は未決） |
| Cloudflare Workers Builds | GitHub 連携による自動ビルド・デプロイ、ブランチごとのプレビュー URL | 予定（GitHub Actions と比較して決める） |
| **Cloudflare Images（`IMAGES` バインディング）** | `next/image` の画像最適化 | 確定（#327） |

フロントエンドの接続先（既存）:

| 接続先 | 用途 | 呼び出し元 |
|---|---|---|
| NatuEve_API | データの取得・投稿 | ブラウザ（将来は SSR からも） |
| Supabase Auth | ログイン（Google OAuth） | ブラウザ |

## 構成図

```
[ブラウザ]
   │
   ├─ ページの取得 ──→ Cloudflare Workers（OpenNext）
   │                    ├─ 静的ファイル（/_next/static/* など）: そのまま返す（Worker は動かない）
   │                    └─ ページ: Next.js が SSR で返す
   │
   ├─ データの取得・投稿 ──→ NatuEve_API（NEXT_PUBLIC_API_BASE_URL）
   │
   └─ ログイン ──→ Supabase Auth
```

- 静的ファイルへのリクエストは Worker を動かさずに返され、課金されない。
- 本番では `next.config.ts` の `rewrites`（開発時の `/api` 転送）を使わない。API は `NEXT_PUBLIC_API_BASE_URL` へ直接呼ぶ。

## Workers の設定

OpenNext の手順に従って `wrangler.jsonc` を追加する。必須の項目は次のとおり。

| 項目 | 値 |
|---|---|
| `main` | `.open-next/worker.js` |
| `compatibility_date` | `2025-05-05` 以降（OpenNext の [troubleshooting](https://opennext.js.org/cloudflare/troubleshooting) 参照。古い日付では `FinalizationRegistry` が使えずエラーになる） |
| `compatibility_flags` | `nodejs_compat` を含める |
| `assets` | `directory`: `.open-next/assets`、`binding`: `ASSETS` |
| `services` | `WORKER_SELF_REFERENCE`（自分自身の Worker 名を指定） |
| `images` | `binding`: `IMAGES`（Cloudflare Images で画像最適化を有効化。#327） |
| プラン | Workers Paid |

- Workers Paid の 1 リクエストあたりの CPU 上限は既定 30 秒（最大 5 分）。無料プランは 10ms。
- `public/_headers` で `/_next/static/*` に長期キャッシュ（`Cache-Control: public,max-age=31536000,immutable`）を付ける。

## 環境変数

環境変数はアプリ用とビルド環境用の 2 種類に分かれる。本番ではどちらもビルド環境の変数として設定する
（Workers Builds なら「Build variables and secrets」、GitHub Actions なら同等の環境変数。どちらを使うかは未決事項 5）。

### アプリ用（`NEXT_PUBLIC_*`）

ビルド時にアプリへ埋め込まれ、ブラウザに渡る。

| 変数 | 本番の値 | 備考 |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | 本番 API のオリジン | API のドメインは NatuEve_API 側で決める |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトの URL | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の公開キー（anon キー） | ブラウザに渡る前提の値 |
| `NEXT_PUBLIC_USE_MSW` | `false` | 本番ではモックを使わない。`true` のときだけ画像最適化のモック用取得元（picsum.photos・i.pravatar.cc）を許可する（#327） |

### ビルド環境用

ビルドに使うツールの設定。アプリには埋め込まれない。

| 変数 | 本番の値 | 備考 |
|---|---|---|
| `BUN_VERSION` | `1.2.21` | ビルド環境の既定は 1.2.15。`package.json` の `packageManager` に合わせる |

- 値を変えたら再ビルドが必要。
- ローカル開発は従来どおり `.env.local` を使う。Workers のランタイムで確認する場合は `.dev.vars`（`NEXTJS_ENV=development`）を使う。
  どちらもコミットしない。

## ビルドとデプロイ

- ローカル開発は従来どおり `bun run dev`（`next dev`）。
- Workers のランタイムでの確認とデプロイには、OpenNext の `preview`・`deploy` スクリプトを `package.json` に追加して使う。
  OpenNext のビルドは内部で `build` スクリプト（`next build`）を呼ぶ。
- **ローカルからは `bun run deploy` を実行しない。** Next.js は本番ビルドでも `.env.local` を読み込み
  （読まないのは test のときだけ）、`NEXT_PUBLIC_*` の値はビルド時にコードへ埋め込まれるため、
  ローカルの値（例: `NEXT_PUBLIC_USE_MSW=true`、ローカル API のオリジン）が本番ビルドに混入する。
  やむを得ずローカルから実行する場合は、本番の値を環境変数として明示的に渡す（`process.env` は `.env.local` より優先される）。
  その際、**`.env.local` にある `NEXT_PUBLIC_*` はすべて上書きする**（渡さなかった変数には `.env.local` の値が使われる。
  特に `NEXT_PUBLIC_USE_MSW=false` を渡し忘れるとモック認証が本番で有効になるため注意）。
  恒久対応として、#330 で CI からのデプロイに限定する。
- **本番の取得元（`assets.natuportal.org`・`lh3.googleusercontent.com`）の `pathname` 制限が完了するまで `deploy` を実行しない（#334）。** デプロイのブロッカーとして扱う。
  開発用ホストは `next.config.ts` から削除済みで、本番ビルド（`NEXT_PUBLIC_USE_MSW=false`）にはモック用の取得元を含めない。
  #334 の AC は現状「開発用の取得元を本番で外す」のみで `pathname` 制限を含まないため、**#334 が close しただけで完了と判断しない**。
  **`NEXT_PUBLIC_USE_MSW=true` でビルドしたプレビュー環境も、`pathname` 制限が完了するまで公開しない。**
  変換枠（ユニーク変換/月）の使用量はアカウント単位で分析・集計される（枠の共有範囲についての公式の明記は確認できていない）ため、
  プレビュー経由でも本番の枠を消費しうる前提で扱う。
- **`/_next/image*` のキャッシュ対応をデプロイ前に確認する。** 本番相当環境で `curl -I` により `Cache-Control`・
  `cf-cache-status` を実測し、付かない場合は `/_next/image*` に Cache Rule を設定する（またはキャッシュ不要と実測で確認する）。
  詳細は未決事項 2。
- Bun はパッケージマネージャーとしてだけ使う（`--bun` フラグは禁止、`bunx` は可）。
- Workers Builds の上限（Paid）: ビルド月 6,000 分、同時ビルド 6 本、タイムアウト 20 分。

## 導入時に必要な変更

#326 で実施し、`preview` で主要ページ（トップ・イベント一覧・イベント詳細・ユーザー詳細・サインイン）の
表示を確認済み。**ページのコードは変更しなくてよい**（動的ルート `event/[id]`・`users/[id]` もそのまま動く）ことが確認できた。

1. 依存パッケージの追加: `@opennextjs/cloudflare@1.20.11`、`wrangler@4.150.0`（devDependencies）。
   OpenNext の対応範囲に合わせて Next.js も 15.5.27 に更新。
2. `wrangler.jsonc`（`compatibility_date: 2025-05-05`、`nodejs_compat`、`global_fetch_strictly_public`）と
   `open-next.config.ts` を追加。
3. `package.json` に `preview`・`deploy`・`upload`・`cf-typegen` スクリプトを追加。
4. `.gitignore` に `.open-next`・`.dev.vars*`・`.wrangler` を追加。
5. `next.config.ts`: `initOpenNextCloudflareForDev()` を呼ぶ。`rewrites` は開発時のみ有効。
   `images.unoptimized` は使わず、画像最適化は `wrangler.jsonc` の `images.binding: IMAGES` で有効化する（#327）。
6. `public/_headers` を追加（`/_next/static/*` に `Cache-Control: public,max-age=31536000,immutable`）。

## SNS シェア（OGP）を追加するとき

- `event/[id]/page.tsx` は `"use client"` のため、そのままでは `generateMetadata` を書けない（Client Component では使えない）。
  「`generateMetadata` を書くサーバー側のページ」と「今の中身を移したブラウザ側の部品」に分ける。
- `generateMetadata` は SSR 時に API からイベント詳細を取得する。API からは、送信元が Cloudflare の IP に見える。
- OGP に載せるのは、認証なしで呼べる API が返す項目だけにする。

## 月額の試算

2026-10 時点の試算。

| 規模 | 月間 PV | Workers Paid | 備考 |
|---|---|---|---|
| 小（公開初期） | 3 万 | $5 | |
| 中 | 30 万 | $5 | |
| 大 | 300 万 | $5〜 | 1 PV あたり CPU 10ms と仮定すると 3,000 万ミリ秒で、含まれる量ちょうど |

- Cloudflare Images（画像最適化）の費用は上の表に含まない。無料枠を超えると Images Paid の契約が必要になる（下記参照）。
- Workers Paid に含まれる量: リクエスト 月 1,000 万件、CPU 月 3,000 万ミリ秒。
  超過分はリクエスト 100 万件あたり $0.30、CPU 100 万ミリ秒あたり $0.02。
- 静的ファイルの配信は無料・無制限。
- 画像最適化は Cloudflare Images（`IMAGES` バインディング、#327）を使う: ユニーク変換 月 5,000 回まで無料。
  無料枠を超えると新規変換が `9422` エラーになる（公式の記載は URL ベースの変換についてのもので、バインディング経由の挙動は未確認。詳細は未決事項 2）。
  有料化する場合は Images Paid を契約する（最初の 5,000 変換を含み、以降 1,000 変換あたり $0.50）。Workers とは別のサービス・別の課金。
- 1 PV あたりの SSR の CPU 時間は未計測。

## 未決事項・今後の作業

1. **フロントのドメイン**: `natuportal.org` のどのサブドメインを使うか。
2. **画像最適化の方式**: 解決済み（#327、決定は [ADR-0002](./adr/0002-use-cloudflare-images-binding.md)）。
   Cloudflare Images の `IMAGES` バインディングを採用
   （`wrangler.jsonc` の `images.binding`。OpenNext が推奨する有効化方法。`next.config.ts` の `images.unoptimized` は使わない）。
   - `preview` で確認済み: ヘッダーロゴ（PNG、約 1.4MB）が WebP 約 2KB、イベント画像（1200x600 の JPEG）が
     w=640 で約 19KB・w=1920 で約 125KB の WebP になる。
   - 費用: ユニーク変換 月 5,000 回まで無料。有料化する場合は Images Paid を契約する（最初の 5,000 変換を含み、以降 1,000 変換あたり $0.50）。
   - 無料枠超過時の挙動・枠の単位は公式には断定できない: 公式の「新規変換は `9422`・キャッシュ済みは配信継続」の記載は URL ベースの変換についてのもので、
     `IMAGES` バインディング経由で同じ挙動になるかは明記されていない。枠の共有範囲（アカウント単位か）の明記もない
     （変換の使用量分析がアカウント単位で提供されていることは確認済み）。また、この構成の `/_next/image` は Cache Rule を設定しない限り
     CDN にキャッシュされないため、「キャッシュ済みは配信継続」が成り立つのは Cache Rule 設定後になる見込み。
     出典: [Images pricing](https://developers.cloudflare.com/images/pricing/) / [Troubleshooting（9422）](https://developers.cloudflare.com/images/reference/troubleshooting/) / [Changelog 2026-07-01（バインディングの課金単位）](https://developers.cloudflare.com/changelog/post/2026-07-01-binding-unique-transformations/)
   - `minimumCacheTTL` は OpenNext では未対応。OpenNext が `Cache-Control: public, max-age=315360000, immutable` を付けるのは
     `/_next/static/media*` か取得元が `immutable` の場合のみで、ヘッダーロゴ（`/images/*` の public ファイル）や R2 の画像には
     付かず、`/_next/image` は CDN にキャッシュされない（表示のたびにデコード・再エンコードが走る）。
     **デプロイ前に** `curl -I 'https://<本番URL>/_next/image?url=...&w=...&q=75'` で `Cache-Control` と `cf-cache-status` を実測し、
     付かない場合は `/_next/image*` に Cache Rule（Cache Eligibility: Eligible、Edge TTL: Override origin）を設定する
     （またはキャッシュ不要と実測で確認する）。
     Edge TTL は画像差し替え時に stale が残らない範囲（例: 1 日）で設定し、差し替え時は `/_next/image*` をパージする
     （`/_next/image` の URL は内容ハッシュを含まず、画像を差し替えても URL が変わらないため）。
     なお `wrangler.jsonc` の `cache.enabled`（Workers Cache）は静的アセット配信まで課金対象になる副作用があるため、この用途では使わない。
   - 許可する画像の取得元: placehold.co・example.com は削除し、picsum.photos・i.pravatar.cc は
     `NEXT_PUBLIC_USE_MSW=true` のビルドでのみ許可する（`next.config.ts`）。
     本番ビルドにはモック用の取得元が入らない。残る本番の取得元（`assets.natuportal.org`・`lh3.googleusercontent.com`）の
     絞り込みは #334 で対応し、**#334 が close するまでデプロイしない**（絞らないと、許可した取得元の任意の画像を
     誰でもこの最適化を通して変換でき、変換数の費用が発生しうる）。
   - 補足: OpenNext 1.20.11 はリダイレクト先 URL を `remotePatterns` で再検証しない（初回 URL のみ検証。
     例: `picsum.photos` は `fastly.picsum.photos` へリダイレクトする）。許可する取得元はリダイレクト先も含めて確認する。
   - #334 で `pathname` を追加する際の注意: Google アバターには現行の `/a/...` と旧形式の `/a-/...` があるため、
     実 API の URL 形式を確認してから確定する（例: `/a*/**`）。
   - 注意: `preview`（`wrangler dev`）の `IMAGES` は low-fidelity 実装で `width`・`height`・`rotate`・`format` のみ対応。
     `fit`・`quality` の効き方は本番（high-fidelity）と異なる場合がある。
3. **ビルドの確認**: 解決済み（#326 で検証）。
   - Next.js 15.5.27 は OpenNext 1.20.11 の対応範囲（`>=15.5.27 <16`）内。
   - `experimental.optimizeCss`（critters）は OpenNext のビルドを通るが、critters は Pages Router のみ適用のため
     App Router では実質無効（CSS は通常どおり配信され、実害なし）。
4. **プレビュー環境の API の接続先**: プレビュー用のビルドが本番の API・DB を使わないよう、ビルド変数を分けるか決める。
5. **CI/CD**: Workers Builds か GitHub Actions か。
6. **API 側の CORS**: 一部解決済み。残っている作業は次のとおり。
   - `http://localhost:8787`（`preview` の wrangler 既定ポート）の許可は NatuEve_API #224 で対応（**マージ後に有効**）。
   - 本番のオリジンは #328 で決まり次第、API 側の環境変数 `CORS_ALLOW_ORIGINS` に設定する（API はワイルドカード非対応、NatuEve_API ADR-0033）。
   - URL が変わる Workers Builds のプレビュー環境は、そのままでは許可できないため、扱いを #330 で決める。

## 参考（料金・仕様の出典）

- OpenNext: [Cloudflare](https://opennext.js.org/cloudflare) / [Get Started](https://opennext.js.org/cloudflare/get-started) / [Environment variables](https://opennext.js.org/cloudflare/howtos/env-vars) / [Image optimization](https://opennext.js.org/cloudflare/howtos/image)
- Cloudflare Workers: [Pricing](https://developers.cloudflare.com/workers/platform/pricing/) / [Limits](https://developers.cloudflare.com/workers/platform/limits/) / [Static Assets の課金](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) / [Workers Builds の上限](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/) / [Build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)
- Cloudflare Images: [Pricing](https://developers.cloudflare.com/images/pricing/) / [Optimize with Workers](https://developers.cloudflare.com/images/optimization/binding/) / [Troubleshooting（9422）](https://developers.cloudflare.com/images/reference/troubleshooting/) / [Changelog 2026-07-01: バインディングの課金単位](https://developers.cloudflare.com/changelog/post/2026-07-01-binding-unique-transformations/)
