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
| Cloudflare Images | `next/image` の画像最適化 | 未決 |

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
| `compatibility_date` | `2024-09-23` 以降 |
| `compatibility_flags` | `nodejs_compat` を含める |
| `assets` | `directory`: `.open-next/assets`、`binding`: `ASSETS` |
| `services` | `WORKER_SELF_REFERENCE`（自分自身の Worker 名を指定） |
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
| `NEXT_PUBLIC_USE_MSW` | `false` | 本番ではモックを使わない |

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
- Bun はパッケージマネージャーとしてだけ使う（`--bun` フラグは禁止、`bunx` は可）。
- Workers Builds の上限（Paid）: ビルド月 6,000 分、同時ビルド 6 本、タイムアウト 20 分。

## 導入時に必要な変更

コードを読んだ範囲では、**ページのコードは変更しなくてよい**。動的ルート（`event/[id]`・`users/[id]`）もそのまま動く見込み。
ただし実際のビルドは未検証（[未決事項](#未決事項今後の作業) 3）。

1. 依存パッケージの追加: `@opennextjs/cloudflare`、`wrangler`（3.99.0 以降、devDependencies）。
   `AGENTS.md` のルールにより、追加の前に確認を取る。
2. `wrangler.jsonc` と `open-next.config.ts` を追加する。
3. `package.json` に `preview`・`deploy` などのスクリプトを追加する。
4. `.gitignore` に `.open-next` と `.dev.vars` を追加する（`.env.local` などは登録済みだが、この 2 つは未登録）。
5. `next.config.ts`:
   - `initOpenNextCloudflareForDev()` を呼ぶ（ローカル開発で Cloudflare のバインディングを使うため）。
   - `rewrites` を開発時だけ有効にする。
   - 画像最適化の方式を設定する（最適化なしなら `images.unoptimized: true`）。
     `next/image` を使う 8 ファイルのうち、4 ファイル（ProfileHeader・GlobalUserAvatar・FileDropZone・MultiFileField）は常に `unoptimized`。
     EventImageCarousel は prop で切り替える（`true` を渡すのは投稿プレビューのみ）。
     残りの 3 ファイル（EventReportImageCarousel・SiteHeader・EventCard）と、イベント詳細の画像カルーセルは最適化を使っている。
     最適化なしにすると、これらの画像は元のサイズのまま配信される。
6. `public/_headers` を追加する。

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

- Workers Paid に含まれる量: リクエスト 月 1,000 万件、CPU 月 3,000 万ミリ秒。
  超過分はリクエスト 100 万件あたり $0.30、CPU 100 万ミリ秒あたり $0.02。
- 静的ファイルの配信は無料・無制限。
- 画像最適化に Cloudflare Images を使う場合: 月 5,000 変換まで無料。超えた分は有料プランで 1,000 変換あたり $0.50。
- 1 PV あたりの SSR の CPU 時間は未計測。

## 未決事項・今後の作業

1. **フロントのドメイン**: `natuportal.org` のどのサブドメインを使うか。
2. **画像最適化の方式**: 最適化なし（`unoptimized`）か、Cloudflare Images か。
3. **ビルドの確認**: 次の 2 点は、実際にビルドして確かめる。
   - `experimental.optimizeCss`（critters）が OpenNext のビルドで動くか。
   - 現在の Next.js（15.5 系）が OpenNext の対応範囲に入っているか。
4. **プレビュー環境の API の接続先**: プレビュー用のビルドが本番の API・DB を使わないよう、ビルド変数を分けるか決める。
5. **CI/CD**: Workers Builds か GitHub Actions か。
6. **API 側の CORS**: 本番のオリジン（とプレビュー URL）を API 側で許可する必要がある（NatuEve_API #218）。

## 参考（料金・仕様の出典）

- OpenNext: [Cloudflare](https://opennext.js.org/cloudflare) / [Get Started](https://opennext.js.org/cloudflare/get-started) / [Environment variables](https://opennext.js.org/cloudflare/howtos/env-vars) / [Image optimization](https://opennext.js.org/cloudflare/howtos/image)
- Cloudflare Workers: [Pricing](https://developers.cloudflare.com/workers/platform/pricing/) / [Limits](https://developers.cloudflare.com/workers/platform/limits/) / [Static Assets の課金](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) / [Workers Builds の上限](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/) / [Build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)
- Cloudflare Images: [Pricing](https://developers.cloudflare.com/images/pricing/)
