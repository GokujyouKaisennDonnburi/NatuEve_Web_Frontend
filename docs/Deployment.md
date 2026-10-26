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
| Cloudflare DNS | 独自ドメインの割り当て（`natueve-web.natuportal.org`。Workers の Custom Domain） | サブドメインは決定（#328）。割り当ては後述の条件がそろってから |
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

## 独自ドメイン

本番のドメインは `natueve-web.natuportal.org` に決めた（#328）。API の `natueve-api.natuportal.org` と名前をそろえている。

| 項目 | 値 | 使う場所 |
|---|---|---|
| 本番のオリジン | `https://natueve-web.natuportal.org` | API の `CORS_ALLOW_ORIGINS`（NatuEve_API #218） |
| OAuth のリダイレクト先 | `https://natueve-web.natuportal.org/auth/callback` | Supabase Auth の Redirect URLs（#332） |
| Supabase Auth の Site URL | 変えるかは要相談 | Supabase Auth の Site URL（#332）。下の注を参照 |

- リダイレクト先は `src/services/auth.ts` の `redirectTo`（`${window.location.origin}/auth/callback`）で決まる。
  Supabase にはオリジンだけでなく、パスを含むこの URL を登録する。
- Supabase Auth の Site URL は、`redirectTo` を指定しない認証フローなどで使われる既定の URL。
  Supabase の Auth は NatuPortal のほかのプロダクトと共有しているため、Site URL をこのオリジンに変えるかは、
  ほかのプロダクトの担当と相談して決める（#332）。このアプリの OAuth は `redirectTo` を必ず指定している。
- モバイルアプリ（NatuEve_Mobile）は API を直接呼ぶため、このドメインを使わない。
  将来、共有リンクからアプリを開く（App Links / Universal Links）場合は、このドメインに検証用のファイル（`/.well-known/` 配下）を置く。

### 割り当て方法

- `wrangler.jsonc` の `routes` に Custom Domain として書き、デプロイで割り当てる。
  設定をリポジトリで管理するため、ダッシュボードからは割り当てない。

  ```jsonc
  "routes": [
    { "pattern": "natueve-web.natuportal.org", "custom_domain": true, "previews_enabled": false }
  ]
  ```

- `natuportal.org` のゾーンは、デプロイ先と同じ Cloudflare アカウントにある（Active。2026-10-22 時点）。
  Custom Domain の DNS レコードと証明書は Cloudflare が作る。
- workers.dev の URL と、バージョンごとの Version URL（旧称 Preview URL。`wrangler.jsonc` の `preview_urls`）は、
  #330（PR #340）で `"workers_dev": false` と `"preview_urls": false` を明示して無効にする。`routes` を追加してもこの 2 つは無効のまま。
  `preview_urls` は、Version URL と、workers.dev 上の Previews（ブランチごとの環境）の URL の両方を制御する。
  - 参考（wrangler 4.150.0 の `getSubdomainValues`）: `workers_dev` を省略すると、`routes` が 1 件以上あれば `false`、0 件（空の配列を含む）なら `true`。
    `preview_urls` を省略すると Worker の今の設定を変えない。どちらも省略に頼らず明示する。
- 独自ドメイン側の配信は、Custom Domain の route の `enabled`（本番）と `previews_enabled`（Previews）で別々に制御する。
  省略すると API の既定（本番は有効、Previews は無効）になる（[wrangler 4.85.0 のリリースノート](https://github.com/cloudflare/workers-sdk/releases/tag/wrangler%404.85.0)）。
  意図をはっきりさせるため、上の例では `"previews_enabled": false` を書く。`enabled` は書かず、本番は既定の有効のままにする。
  - `"enabled": false` にすると本番の配信を止められる。ただし公式に載っているのは `"previews_enabled": true` と組み合わせて
    Previews 専用にする使い方だけで、両方を `false` にした（何も配信しない）ときの挙動は確認できていない。
    そのため「`enabled: false` で先に設定しておく」方法は取らず、下の条件がそろってから `routes` を追加する。

### 割り当てる時期

`routes` を追加したデプロイの時点で、このドメインに誰でもアクセスできるようになる（上の例は `enabled` を書かず、本番が有効になるため）。
そのため、次がすべてそろってから `routes` を追加する PR を出す（#328 の残りの作業）。
workers.dev の URL と Version URL での公開は、これとは別に `workers_dev` と `preview_urls` で止める（#330 で扱う）。

- #342（OpenNext のビルドが失敗する問題）が解決している（PR #345 で解決済み）。
- #330（CI からのデプロイ）ができている。ローカルからはデプロイしない（後述の「ビルドとデプロイ」）。
- 本番の取得元の `pathname` 制限が入っている（#351）。#334 の AC には含まれないため、#334 が閉じたことでは判断しない
  （後述の「画像最適化」を参照）。それまでは本番を公開しない。
- API の独自ドメインに HTTPS で届く（`https://natueve-api.natuportal.org/health` が `{"status":"ok"}` を返す）。
  NatuEve_API の `docs/Deployment.md`「独自ドメイン経由の検証（#226）」が済んでいること。済んでいないと、公開した直後から API の呼び出しがすべて失敗する。
- 上の表の本番のオリジンを API の `CORS_ALLOW_ORIGINS` に、OAuth のリダイレクト先を Supabase Auth の Redirect URLs に登録している
  （Site URL は共有プロジェクトのため要相談で、この条件には含めない）。
  登録していないと、公開した直後から API の呼び出しとログインが失敗する。

追加したら、`https://natueve-web.natuportal.org` で次を確認する。トップページが表示されても、CORS や Redirect URLs の登録の誤りは分からないため、3 つとも確かめる。

- トップページが HTTPS で表示される。
- ブラウザから API を呼べる（イベント一覧が表示され、CORS のエラーが出ない）。
- Google でログインし、`/auth/callback` を経てログイン済みになる（Supabase の Redirect URLs が通る。#332 の AC と同じ）。

### 注意

- **CI からのデプロイでは、既存の DNS レコードやほかの Worker への割り当てが、確認なしで上書きされる。**
  wrangler は対話できない環境（CI）では `override_existing_dns_record` と `override_existing_origin` を `true` にする（wrangler 4.150.0）。
  `pattern` を書き間違えると、ほかのサービスのホスト名を奪うおそれがある。
  例えば API の `natueve-api.natuportal.org` は、同じアカウントの中継用 Worker の Custom Domain にする方針になっている（NatuEve_API ADR-0034）。
  `routes` を追加する PR では、`pattern` の綴り、そのホスト名に既存の DNS レコードがないこと、
  ほかの Worker の Custom Domain に割り当てられていないことをダッシュボードで確かめてからマージする。
- **Custom Domain の割り当てには、対象ゾーンの Zone > Workers Routes > Write が必要**（[Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/)）。
  割り当てた後のデプロイには、割り当てを変えない限りこの権限はいらない。
  今のトークンは「Edit Cloudflare Workers」テンプレートで作っており、この権限は含まれる
  （[API token templates](https://developers.cloudflare.com/fundamentals/api/reference/template/)）。
  `routes` を追加する前に、トークンの Zone のスコープに `natuportal.org` が入っていることをダッシュボードで確かめる。
- **`routes` から消しても、Custom Domain は外れない。**
  wrangler は Custom Domain の route が 1 件もないと、Custom Domain の API を呼ばない（wrangler 4.150.0）。
  このリポジトリの Custom Domain は 1 つなので、`routes` から消すと 0 件になり、割り当ては残る
  （複数あるうちの一部だけを消した場合の挙動は未確認）。
  外すときは、Cloudflare のダッシュボードで Worker の Custom Domain を削除し、
  `https://natueve-web.natuportal.org` が Worker に割り当たっていないことを確認する。

## 環境変数

環境変数はアプリ用とビルド環境用の 2 種類に分かれる。本番ではどちらもビルド環境の変数として設定する
（Workers Builds なら「Build variables and secrets」、GitHub Actions なら同等の環境変数。どちらを使うかは未決事項 5）。

### アプリ用（`NEXT_PUBLIC_*`）

ビルド時にアプリへ埋め込まれ、ブラウザに渡る。

| 変数 | 本番の値 | 備考 |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://natueve-api.natuportal.org` | NatuEve_API の本番オリジン（API の中継用 Worker の Custom Domain。NatuEve_API ADR-0034） |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトの URL | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の公開キー（anon キー） | ブラウザに渡る前提の値 |
| `NEXT_PUBLIC_USE_MSW` | `false` | 本番ではモックを使わない。`true` のときだけ画像最適化のモック用取得元（picsum.photos・i.pravatar.cc）を許可する（#327） |
| `NEXT_PUBLIC_USE_DEV_ASSETS` | `false` | 本番以外のビルド用。`true` のときだけ画像最適化で開発用 R2 の公開ドメイン `assets-dev.natuportal.org` を許可する（#353）。未設定・`false` では許可しない |

`NEXT_PUBLIC_USE_DEV_ASSETS` はビルド時に `next.config.ts` の `images.remotePatterns` へ反映される（実行時には変えられない）。

- ローカル開発・`bun run preview`: `.env.local` に `NEXT_PUBLIC_USE_DEV_ASSETS=true` を設定する（`.env.example` の既定）。
- 検証環境: ビルド環境変数に `NEXT_PUBLIC_USE_DEV_ASSETS=true` を設定する。検証環境での表示確認は、環境ができてから行う（NatuEve_API#219）。
- 本番: 設定しない（未設定または `false`）。本番の許可リストは `assets.natuportal.org` と `lh3.googleusercontent.com` のまま。
- `.dev.vars` は Worker の実行時変数なので、このフラグには効かない。値を変えたら再ビルドする。
- 本番と同じビルドを検証環境にも出す運用にする場合は、本番の許可リストに `assets-dev.natuportal.org` が入るため、この方式は使えない（環境ごとにビルドする前提）。

### ビルド環境用

ビルドに使うツールの設定。アプリには埋め込まれない。

| 変数 | 本番の値 | 備考 |
|---|---|---|
| `BUN_VERSION` | `1.2.21` | ビルド環境の既定は 1.2.15。`package.json` の `packageManager` に合わせる |

- 値を変えたら再ビルドが必要。
- ローカル開発は従来どおり `.env.local` を使う。Workers のランタイムで確認する場合は `.dev.vars`（`NEXTJS_ENV=development`）を使う。
  どちらもコミットしない。`NEXT_PUBLIC_USE_DEV_ASSETS` はビルド時に効くため、`.dev.vars` ではなく `.env.local` またはビルド環境変数に設定する。

## ビルドとデプロイ

- ローカル開発は従来どおり `bun run dev`（`next dev`）。
- Workers のランタイムでの確認とデプロイには、OpenNext の `preview`・`deploy` スクリプトを `package.json` に追加して使う。
  OpenNext のビルドは内部で `build` スクリプト（`next build`）を呼ぶ。
- **ローカルからは `bun run deploy` を実行しない。** Next.js は本番ビルドでも `.env.local` を読み込み
  （読まないのは test のときだけ）、`NEXT_PUBLIC_*` の値はビルド時にコードへ埋め込まれるため、
  ローカルの値（例: `NEXT_PUBLIC_USE_MSW=true`、`NEXT_PUBLIC_USE_DEV_ASSETS=true`、ローカル API のオリジン）が本番ビルドに混入する。
  やむを得ずローカルから実行する場合は、本番の値を環境変数として明示的に渡す（`process.env` は `.env.local` より優先される）。
  その際、**`.env.local` にある `NEXT_PUBLIC_*` はすべて上書きする**（渡さなかった変数には `.env.local` の値が使われる。
  特に `NEXT_PUBLIC_USE_MSW=false` と `NEXT_PUBLIC_USE_DEV_ASSETS=false` を渡し忘れると、モック認証や開発用画像の許可が本番で有効になるため注意）。
  恒久対応として、#330 で CI からのデプロイに限定する。
- **本番の取得元（`assets.natuportal.org`・`lh3.googleusercontent.com`）の `pathname` 制限が完了するまで `deploy` を実行しない（[#351](https://github.com/GokujyouKaisennDonnburi/NatuEve_Web_Frontend/issues/351)）。** デプロイのブロッカーとして扱う。`pathname` を入れるときは、開発用の `assets-dev.natuportal.org` にも同じ値を付ける（キー形式は本番と同じ）。
  開発用の取得元は本番ビルド（`NEXT_PUBLIC_USE_MSW` と `NEXT_PUBLIC_USE_DEV_ASSETS` が `true` 以外。未設定・`false` を含む）の許可リストから外している。`assets-dev.natuportal.org` は `NEXT_PUBLIC_USE_DEV_ASSETS=true` のビルドでのみ許可し、placehold.co・example.com は削除、picsum.photos・i.pravatar.cc は MSW ビルドでのみ許可する。この除外は `src/__tests__/nextConfigImageHosts.test.ts` で検証している。
  #334 の AC は「開発用の取得元を本番で外す」のみで `pathname` 制限を含まないため、**#334 が close しただけで完了と判断しない**（pathname 制限は [#351](https://github.com/GokujyouKaisennDonnburi/NatuEve_Web_Frontend/issues/351) で対応する）。
  **`NEXT_PUBLIC_USE_MSW=true` または `NEXT_PUBLIC_USE_DEV_ASSETS=true` でビルドしたプレビュー環境も、`pathname` 制限が完了するまで公開しない。**
  変換枠（ユニーク変換/月）の使用量はアカウント単位で分析・集計される（枠の共有範囲についての公式の明記は確認できていない）ため、
  プレビュー経由でも本番の枠を消費しうる前提で扱う。
- **`natuportal.org` ゾーンの Images > Transformations が無効であることをデプロイ前に再確認する（#334）。**
  有効な場合、`/cdn-cgi/image/...` は `/_next/image` を通らず `remotePatterns` が効かず、同ゾーンの
  `assets.natuportal.org`・`assets-dev.natuportal.org` の画像を誰でも変換できる。
- **`/_next/image*` のキャッシュ方針をデプロイ前に決めて実測する。** zone の Cache Rule は Worker の応答には効かないため、
  Workers Cache を有効化するか（課金の試算が必要）、キャッシュ不要と確認する。本番相当環境で `curl -I` により
  `Cache-Control`・`cf-cache-status` を実測する。詳細は[画像最適化](#画像最適化)を参照。
- Bun はパッケージマネージャーとしてだけ使う（`--bun` フラグは禁止、`bunx` は可）。
- Workers Builds の上限（Paid）: ビルド月 6,000 分、同時ビルド 6 本、タイムアウト 20 分。

## 導入時に必要な変更

#326 で実施し、`preview` で主要ページ（トップ・イベント一覧・イベント詳細・ユーザー詳細・サインイン）の
表示を確認済み。**ページのコードは変更しなくてよい**（動的ルート `event/[id]`・`users/[id]` もそのまま動く）ことが確認できた。

1. 依存パッケージの追加: `@opennextjs/cloudflare@1.20.11`、`wrangler@4.150.0`（devDependencies）。
   OpenNext の対応範囲に合わせて Next.js も 15.5.27 に更新。
   いずれも #326 当時の版。今の版は `package.json` を参照する（OpenNext 1.20.11 では #342 のビルド失敗が起きる）。
2. `wrangler.jsonc`（`compatibility_date: 2025-05-05`、`nodejs_compat`、`global_fetch_strictly_public`）と
   `open-next.config.ts` を追加。
3. `package.json` に `preview`・`deploy`・`upload`・`cf-typegen` スクリプトを追加。
4. `.gitignore` に `.open-next`・`.dev.vars*`・`.wrangler` を追加。
5. `next.config.ts`: `initOpenNextCloudflareForDev()` を呼ぶ。`rewrites` は開発時のみ有効。
   `images.unoptimized` は使わず、画像最適化は `wrangler.jsonc` の `images.binding: IMAGES` で有効化する（#327）。
6. `public/_headers` を追加（`/_next/static/*` に `Cache-Control: public,max-age=31536000,immutable`）。

## 画像最適化

`next/image` の画像最適化は Cloudflare Images（`IMAGES` バインディング）を使う（#327。決定と代替案は [ADR-0002](./adr/0002-use-cloudflare-images-binding.md)）。
`wrangler.jsonc` の `images.binding` で有効化し、`next.config.ts` の `images.unoptimized` は使わない。

- 独自 loader（`loaderFile`）は使っていない。許可する取得元は `next.config.ts` の `images.remotePatterns` で制御するため、
  Cloudflare ダッシュボードでの取得元制限は不要。`natuportal.org` ゾーンの Images > Transformations も無効にしているため、
  `/cdn-cgi/image/...` 経由の変換はできない（#334 の AC 2 は対象外）。無効にしている理由は
  「ゾーンの Transformations を無効にする理由」を参照。
- `preview` で確認済み: ヘッダーロゴ（PNG、約 1.4MB）が WebP 約 2KB、イベント画像（1200x600 の JPEG）が
  w=640 で約 19KB・w=1920 で約 125KB の WebP になる。
- 費用: ユニーク変換 月 5,000 回まで無料。Free プランのままなら超過分の課金はない（新規変換が `9422` で失敗する。バインディング経由の挙動は未確認。次項参照）。
  課金が発生するのは Images Paid を契約した場合（最初の 5,000 変換を含み、以降 1,000 変換あたり $0.50）。
- 無料枠超過時の挙動・枠の単位は公式には断定できない: 公式の「新規変換は `9422`・キャッシュ済みは配信継続」の記載は URL ベースの変換についてのもので、
  `IMAGES` バインディング経由で同じ挙動になるかは明記されていない。枠の共有範囲（アカウント単位か）の明記もない
  （変換の使用量分析がアカウント単位で提供されていることは確認済み）。「キャッシュ済みは配信継続」がこの構成で成り立つかは、
  下記のキャッシュ方式とデプロイ前の実測で確認する。
  出典: [Images pricing](https://developers.cloudflare.com/images/pricing/) / [Troubleshooting（9422）](https://developers.cloudflare.com/images/reference/troubleshooting/) / [Changelog 2026-07-01（バインディングの課金単位）](https://developers.cloudflare.com/changelog/post/2026-07-01-binding-unique-transformations/)
- `minimumCacheTTL` は OpenNext では未対応。OpenNext が `Cache-Control: public, max-age=315360000, immutable` を付けるのは
  `/_next/static/media*`（静的 import。ヘッダーロゴは #327 で対応済み）か取得元が `immutable` の場合のみで、R2 の画像などには付かない。
- キャッシュの方式: zone の Cache Rule は Worker の応答には効かない（[Workers Cache](https://developers.cloudflare.com/workers/cache/) の
  「No zone configuration for caching applies to Workers Caching. Cache Rules … have no effect on a Worker's cache.」）。次のどちらかを選ぶ。
  - **(a) Workers Cache を使う**（`wrangler.jsonc` に `"cache": { "enabled": true }`。[Images バインディング](https://developers.cloudflare.com/images/optimization/binding/)が推奨）。
    有効にすると静的アセットのリクエストも standard rate で課金される（"Caching bills requests that are normally free"）ため、
    月 1,000 万件の含まれる量に収まるか試算してから判断する。`Cache-Control` が付かない応答は heuristic freshness 扱いで、
    ステータスごとの既定 TTL が適用される（200 は 2 時間、404 は 3 分など。表にないステータスは既定ではキャッシュされない）。
    OpenNext はパージしないため、同じ URL の画像差し替えは最大 2 時間反映されない
    （再デプロイではバージョンがキャッシュキーに含まれるためキャッシュがリセットされる）。
    パージは Worker 側の `ctx.cache.purge()` のみで、zone からの URL パージはできない。
    対象は画像に限らず、HTML を含む Worker の全応答。プリレンダー HTML には OpenNext が
    `s-maxage=31536000, stale-while-revalidate=2592000` を付けるため、次のデプロイまでエッジにキャッシュされる
    （データはブラウザ側で取得し、デプロイでキャッシュも空になるため実害は小さい見込み）。
    パス単位では絞れず、キャッシュさせたくない応答には `Cache-Control: no-store`（または `private`）を付ける
    （動的ルートには Next.js が付ける）。なお画像応答は `Vary: Accept` のため Accept ごとにキャッシュが分かれる（`format`・`quality` はユニーク変換の判定から除外されるため、変換枠の消費は増えない）。
  - **(b) Workers Cache を使わない**。R2 の画像は表示のたびに変換が走る。同じ画像・同じパラメータの変換は
    月 1 回だけ数えるため、表示のたびに枠は減らない（主な影響は変換を待つ応答時間）。表示回数の多い画像は
    ブラウザキャッシュ（静的 import。ロゴは対応済み）で影響を抑える。
- どちらの場合も、**デプロイ前に** `curl -I 'https://<本番URL>/_next/image?url=...&w=...&q=75'` を2回実行し、
  `Cache-Control`・`cf-cache-status` を実測して最終確認する（静的 import の画像は immutable が付く）。
- 許可する画像の取得元: placehold.co・example.com は削除。`assets-dev.natuportal.org` は
  `NEXT_PUBLIC_USE_DEV_ASSETS=true` のビルドでのみ許可し、picsum.photos・i.pravatar.cc は
  `NEXT_PUBLIC_USE_MSW=true` のビルドでのみ許可する（`next.config.ts`）。
  本番ビルド（`NEXT_PUBLIC_USE_DEV_ASSETS` が `true` 以外。未設定・`false` を含む）には開発用の取得元が入らない
  （`src/__tests__/nextConfigImageHosts.test.ts` で設定値を検証）。
  残る本番の取得元（`assets.natuportal.org`・`lh3.googleusercontent.com`）の
  絞り込み（`pathname` 制限）は [#351](https://github.com/GokujyouKaisennDonnburi/NatuEve_Web_Frontend/issues/351) で対応し、**`pathname` 制限が完了するまでデプロイしない**
  （#334 の AC 外であり、#334 が close しただけでは判断しない。絞らないと、許可した取得元の任意の画像を誰でもこの最適化を通して変換でき、
  無料枠（月 5,000 ユニーク変換）を消費する。超過すると新規変換が `9422` で失敗して画像が表示されなくなる。
  Free プランのままなら超過分の課金はない（課金が発生するのは Images Paid を契約した場合。
  バインディング経由の `9422` の挙動は上記のとおり未確認））。
  開発用の `assets-dev.natuportal.org` にも同じ `pathname` 制限を付ける（キー形式は本番と同じ）。
- ローカル確認: API の `R2_PUBLIC_BASE_URL` を `https://assets-dev.natuportal.org` にし、フロントの `.env.local` に
  `NEXT_PUBLIC_USE_MSW=false`・`NEXT_PUBLIC_USE_DEV_ASSETS=true`・`NEXT_PUBLIC_API_BASE_URL=http://localhost:8085` を設定する。
  `bun run dev` で `/event-list`・`/event/<id>`（詳細・レポート）を開き、画像が表示されることと
  `/_next/image?url=...` が 200 を返すことを確認する。検証環境での確認は環境ができてから行う（NatuEve_API#219）。
- 補足: OpenNext 1.20.11 はリダイレクト先 URL を `remotePatterns` で再検証しない（初回 URL のみ検証。
  例: `picsum.photos` は `fastly.picsum.photos` へリダイレクトする）。許可する取得元はリダイレクト先も含めて確認する。
- `pathname` を追加する際の注意: Google アバターには現行の `/a/...` と旧形式の `/a-/...` があるため、
  実 API の URL 形式を確認してから確定する（例: `/a*/**`）。
- 注意: `preview`（`wrangler dev`）の `IMAGES` は low-fidelity 実装で `width`・`height`・`rotate`・`format` のみ対応。
  `fit`・`quality` の効き方は本番（high-fidelity）と異なる場合がある。

### ゾーンの Transformations を無効にする理由

`natuportal.org` ゾーンの Images > Transformations は無効にしている（2026-10-23 時点で確認）。
有効にすると `/cdn-cgi/image/...` という URL 経由の画像変換が使えるが、本構成では次の理由で無効のまま運用する。

- **URL 変換は `/_next/image` を通らない**: `/cdn-cgi/image/...` は `next/image` の `/_next/image` を通らないため、`next.config.ts` の `images.remotePatterns` による取得元の制限が効かない。
- **同一ゾーンの画像が対象になる**: Cloudflare は既定で、Transformations を有効にしたゾーンと同じゾーンの画像をソースとして許可する。`assets.natuportal.org`・`assets-dev.natuportal.org` は `natuportal.org` と同じゾーン（Cloudflare 経由のホスト）なので、有効にすると誰でもこれらの画像を変換できる。
- **変換枠を消費する**: 変換はユニーク変換数で課金・枠消費される（月 5,000 回まで無料）。第三者による変換で枠を消費すると、新規変換が `9422` で失敗して画像が表示されなくなる可能性がある。Images Paid を契約している場合は費用も発生する。
- **許可取得元が Any origin だと影響が広がる**: 許可取得元を「Any origin」に設定している場合、外部の任意画像も変換対象になり、リスクと費用がさらに大きくなる。
- **`IMAGES` バインディングは別経路**: バインディングは Worker が受け取った画像データを変換する方式で、公式ドキュメントの前提条件にはゾーンの Transformations 設定は挙がっていない（不要との明記はない）。デプロイ後に `/_next/image` が変換済み画像を返すことは実測で確認する。
- **本構成では不要**: 画像最適化は `IMAGES` バインディングを使うため URL 変換を必要とせず、独自 loader も採用していない。

デプロイ前に、この設定が無効のままであることを再確認する。有効化する場合は `remotePatterns` では制御できない変換経路ができるため、AC 2 の対象として扱い、許可取得元の制限や費用・可用性への影響を別途検討する。

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
  無料枠を超えると新規変換が `9422` エラーになる（公式の記載は URL ベースの変換についてのもので、バインディング経由の挙動は未確認。詳細は[画像最適化](#画像最適化)を参照）。
  有料化する場合は Images Paid を契約する（最初の 5,000 変換を含み、以降 1,000 変換あたり $0.50）。Workers とは別のサービス・別の課金。
- 1 PV あたりの SSR の CPU 時間は未計測。

## 未決事項・今後の作業

1. **フロントのドメイン**: 解決済み（#328 で `natueve-web.natuportal.org` に決定。上の「独自ドメイン」を参照）。
   割り当て（`routes` の追加）は、「割り当てる時期」の条件がそろってから行う。
2. **画像最適化の方式**: 解決済み（#327、決定は [ADR-0002](./adr/0002-use-cloudflare-images-binding.md)）。詳細は[画像最適化](#画像最適化)を参照。
3. **ビルドの確認**: 解決済み（#326 で検証）。
   - Next.js 16.4.2 は OpenNext 1.20.13 の対応範囲（`>=15.5.28 <16 || >=16.4.1`）内（#346 で更新）。
   - OpenNext 1.20.12 以前は、Next.js のメジャー版がリリースから 2 年経つとビルドを止めていた（Next.js 15 は 2026-10-21 から失敗）。1.20.13 からは、2 つ後のメジャー版（Next.js 17）のリリース日が `@opennextjs/aws` の日付表に追加されるまで対応扱いになる（`dist/build/helper.js` の `isNextVersionSupported`）。
   - これは OpenNext 側の判定の話で、Next.js 15 自体は Maintenance LTS（重大なバグ修正と必要なセキュリティ修正だけが出る）。
     公式のサポートポリシーでは「各メジャー版はリリースから 2 年間 Maintenance LTS」とされ、15 は 2024-10-21 リリースのため、
     まもなくサポート対象から外れる見込み（終了日は明記されていない）。
     また、Next.js 17 のリリース日が追加された OpenNext に上げると、15 は 2 年の期限で判定され、再びビルドが失敗する。
     #346 で Next.js 16（16.4.2）に移行した。
   - `experimental.optimizeCss`（critters）は OpenNext のビルドを通るが、critters は Pages Router のみ適用のため
     App Router では実質無効（CSS は通常どおり配信され、実害なし）。
4. **プレビュー環境の API の接続先**: プレビュー用のビルドが本番の API・DB を使わないよう、ビルド変数を分けるか決める。
5. **CI/CD**: Workers Builds か GitHub Actions か。
6. **API 側の CORS**: 一部解決済み。残っている作業は次のとおり。
   - `http://localhost:8787`（`preview` の wrangler 既定ポート）の許可は NatuEve_API #224 で対応（**マージ後に有効**）。
   - 本番のオリジン `https://natueve-web.natuportal.org`（#328 で決定。上の「独自ドメイン」を参照）を、API 側の環境変数 `CORS_ALLOW_ORIGINS` に設定する（API はワイルドカード非対応、NatuEve_API ADR-0033）。
   - URL が変わる Workers Builds のプレビュー環境は、そのままでは許可できないため、扱いを #330 で決める。

## 参考（料金・仕様の出典）

- OpenNext: [Cloudflare](https://opennext.js.org/cloudflare) / [Get Started](https://opennext.js.org/cloudflare/get-started) / [Environment variables](https://opennext.js.org/cloudflare/howtos/env-vars) / [Image optimization](https://opennext.js.org/cloudflare/howtos/image)
- Cloudflare Workers: [Pricing](https://developers.cloudflare.com/workers/platform/pricing/) / [Limits](https://developers.cloudflare.com/workers/platform/limits/) / [Static Assets の課金](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) / [Workers Builds の上限](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/) / [Build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)
- Cloudflare Workers Cache: [Workers Cache](https://developers.cloudflare.com/workers/cache/) / [Configuration（Cache-Control なしの既定 TTL）](https://developers.cloudflare.com/workers/cache/configuration/) / [Limitations（zone の設定は無効）](https://developers.cloudflare.com/workers/cache/limitations/)
- Cloudflare Images: [Pricing](https://developers.cloudflare.com/images/pricing/) / [Optimize with Workers](https://developers.cloudflare.com/images/optimization/binding/) / [Troubleshooting（9422）](https://developers.cloudflare.com/images/reference/troubleshooting/) / [Changelog 2026-07-01: バインディングの課金単位](https://developers.cloudflare.com/changelog/post/2026-07-01-binding-unique-transformations/)
