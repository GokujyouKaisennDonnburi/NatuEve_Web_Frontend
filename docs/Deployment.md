# デプロイ構成（フロントエンド）

NatuEve_Web_Frontend の本番デプロイ構成をまとめる。
構成を選んだ理由と退けた代替案は [ADR-0001](./adr/0001-deploy-cloudflare-workers-opennext.md) を参照。
ブランチ運用と検証環境・本番デプロイの承認の方式は [ADR-0003](./adr/0003-github-flow-staging-approval.md) を参照。
料金・仕様は 2026-10 時点で各公式ページを確認した値（出典は末尾）。
バックエンド（API）の構成は NatuEve_API リポジトリの `docs/Deployment.md` を参照。

## 使用するサービス

| サービス | 用途 | 状態 |
|---|---|---|
| **Cloudflare Workers（Paid プラン）** | Next.js の SSR と静的ファイルの配信 | 確定 |
| **OpenNext（`@opennextjs/cloudflare`）** | Next.js を Workers で動かすためのアダプタ | 確定 |
| Cloudflare DNS | 独自ドメインの割り当て（`natueve-web.natuportal.org`。Workers の Custom Domain） | サブドメインは決定（#328）。割り当ては後述の条件がそろってから |
| **Cloudflare Images（`IMAGES` バインディング）** | `next/image` の画像最適化 | 確定（#327） |
| **GitHub Actions（Environments）** | ビルドとデプロイ（検証環境は自動、本番は承認後） | 方針は決定（ADR-0003）。実装は #330 |

- 使わないサービス: Cloudflare Workers Builds（Git 連携による Cloudflare 側のビルド）。デプロイは GitHub Actions から行う（ADR-0003）。
  ダッシュボードで Git 連携を接続しない。

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
| Supabase Auth の Site URL | `https://natueve-web.natuportal.org`（パスを含めないオリジン） | Supabase Auth の Site URL（#332）。下の注を参照 |

- リダイレクト先は `src/services/auth.ts` の `redirectTo`（`${window.location.origin}/auth/callback`）で決まる。
  Supabase にはオリジンだけでなく、パスを含むこの URL を登録する。
- Supabase Auth の Site URL は、`redirectTo` を指定しない認証フローなどで使われる既定の URL。このアプリの OAuth は `redirectTo` を必ず指定している。
  `redirectTo` が許可されないときは、エラーにならず、Referer の URL が許可されていればそこへ、そうでなければ Site URL へ戻される。
  また、Site URL とスキーム・ホスト・ポートが同じ URL は、Redirect URLs に登録がなくても許可される
  （supabase/auth の `internal/utilities/request.go` の `GetReferrer`・`IsRedirectURLValid`。2026-10-27 時点の master（`c3348e8`）で確認。
  本番で動いている Supabase の版では確かめていない）。
- 本番の Auth はなちゅいべ用の Supabase プロジェクト（Auth 専用。`natueveOAuth`）で、このプロジェクトのみで使い、NatuPortal のほかのプロダクトと共有していない（#332 で確認済み）。
  そのため Site URL は本番のオリジンにする（#332）。将来ほかのプロダクトと共有する場合は、Site URL をほかのプロダクトの担当と相談して決め直す。
  モバイルアプリ（NatuEve_Mobile）がこの Auth を使うかは未確認（2026-10-27 時点の main に認証の実装がなく、使うかは決まっていない）。
  使うことになったら、モバイルのリダイレクト先を Redirect URLs に加える。
  Site URL を本番のオリジンにすると Redirect URLs がなくてもログインできるが、Redirect URLs への登録は外さない。
  Site URL をほかのオリジンに変えたときに、ログインが壊れないようにするため。
- モバイルアプリ（NatuEve_Mobile）は API を直接呼ぶため、このドメインを使わない。
  将来、共有リンクからアプリを開く（App Links / Universal Links）場合は、このドメインに検証用のファイル（`/.well-known/` 配下）を置く。

### 割り当て方法

- Custom Domain は、管理者が Cloudflare のダッシュボードで Worker に割り当てる（ADR-0003 決定 3）。`wrangler.jsonc` の `routes` には書かない。
  `routes` で割り当てるには CI のトークンにゾーンの Workers Routes Write が要る。この権限はゾーン全体に効き、
  漏れると API のホスト名（`natueve-api.natuportal.org`）なども付け替えられるため、CI のトークンには付けない。
  割り当ては一度きりの作業なので、ダッシュボードで行う。検証用の Custom Domain も同じ。
- `wrangler.jsonc` は、最上位も `env.staging` も `"routes": []` を明示する（`env.staging` は書かないと最上位の値を引き継ぐ。ADR-0003 決定 4）。
  `routes` に Custom Domain が 1 件もなければ、wrangler はデプロイで Custom Domain を付け替える API を呼ばない（wrangler 4.150.0）。
  そのため、ダッシュボードで割り当てた Custom Domain はデプロイでは変わらない。
  ただし、読み取りの一覧（アカウント単位の Custom Domain の一覧）は呼ぶことがある。トークンの権限への影響は下の「Cloudflare の API トークン」の「未確認」を参照。
- `natuportal.org` のゾーンは、デプロイ先と同じ Cloudflare アカウントにある（Active。2026-10-22 時点）。
  Custom Domain の DNS レコードと証明書は Cloudflare が作る。
- workers.dev の URL と、バージョンごとの Version URL（旧称 Preview URL。`wrangler.jsonc` の `preview_urls`）は、
  #330（PR #340）で `"workers_dev": false` と `"preview_urls": false` を明示して無効にする。Custom Domain を割り当ててもこの 2 つは無効のまま。
  `preview_urls` は、Version URL と、workers.dev 上の Previews（ブランチごとの環境）の URL の両方を制御する。
  - 参考（wrangler 4.150.0 の `getSubdomainValues`）: `workers_dev` を省略すると、`routes` が 1 件以上あれば `false`、0 件（空の配列を含む）なら `true`。
    `routes` は `[]` にするため、省略すると workers.dev で公開される。`preview_urls` を省略すると Worker の今の設定を変えない。どちらも省略に頼らず明示する。
- Custom Domain での配信は、本番（`enabled`）と Previews（`previews_enabled`）で別々に制御される。
  `routes` でこれらを省略したときの API の既定は、本番が有効、Previews が無効
  （[wrangler 4.85.0 のリリースノート](https://github.com/cloudflare/workers-sdk/releases/tag/wrangler%404.85.0)）。
  ダッシュボードで割り当てたときの既定は確かめていないため、割り当てた後、Custom Domain で Previews が配信されていないことを確かめる。

### 割り当てる時期

割り当てた時点で、このドメインに誰でもアクセスできるようになる。
そのため、次がすべてそろってから管理者が割り当てる（#328 の残りの作業）。
workers.dev の URL と Version URL での公開は、これとは別に `workers_dev` と `preview_urls` で止める（#330 で扱う）。

- #342（OpenNext のビルドが失敗する問題）が解決している（PR #345 で解決済み）。
- #330（CI からのデプロイ）ができている。ローカルからはデプロイしない（後述の「ビルドとデプロイ」）。
- 本番の取得元の `pathname`・`search`・`port` の制限が入っている（#351 で対応済み。後述の「画像最適化」を参照）。
  実データで画像が表示されることは、検証環境（`assets-dev.natuportal.org`。キーの形式は本番と同じ）で、割り当ての前に確かめる。
- API の独自ドメインに HTTPS で届く（`https://natueve-api.natuportal.org/health` が `{"status":"ok"}` を返す）。
  NatuEve_API の `docs/Deployment.md`「独自ドメイン経由の検証（#226）」が済んでいること。済んでいないと、公開した直後から API の呼び出しがすべて失敗する。
- 上の表の本番のオリジンを API の `CORS_ALLOW_ORIGINS` と Supabase Auth の Site URL に、OAuth のリダイレクト先を Supabase Auth の Redirect URLs に登録している。
  `CORS_ALLOW_ORIGINS` を登録していないと、公開した直後から API の呼び出しが失敗する。
  Site URL と Redirect URLs は両方とも登録する。どちらか一方が合っていればログインは通るが、Redirect URLs を残す理由は上の「独自ドメイン」の注のとおり。
  どちらも本番の値になっていないと、ログイン後にその時点の Site URL（本番のオリジンではない）へ戻され、ログインが失敗する。

割り当てたら、`https://natueve-web.natuportal.org` で次を確認する。トップページが表示されても、CORS や Supabase Auth の登録の誤り、画像の許可リストのずれは分からないため、4 つとも確かめる。

- トップページが HTTPS で表示される。
- ブラウザから API を呼べる（イベント一覧が表示され、CORS のエラーが出ない）。
- Google でログインし、`/auth/callback` を経てログイン済みになる（#332 の AC と同じ）。
  Site URL と Redirect URLs のどちらかが合っていれば通るため、この確認ではもう一方の誤りは分からない。
  Site URL が `https://natueve-web.natuportal.org`（パスを含めないオリジン）、Redirect URLs が `https://natueve-web.natuportal.org/auth/callback` のみであることを、
  Supabase のダッシュボードで別に確かめる。Redirect URLs に開発・プレビュー用の URL や `https://*.natuportal.org/**` のような広いワイルドカードがないことも確かめる（#332 の AC）。
  検証用の URL は検証用 Auth プロジェクト側で管理し、本番には入れない。
- 画像が表示される（イベント一覧・イベント詳細・レポート・ヘッダーのアバター）。`pathname` の値が API の画像の URL と合わないと、
  イベント・レポートの画像が `/_next/image` の 400 で表示されない（#351）。

### 注意

- **割り当てる前に、ホスト名と既存の割り当てを確かめる。** 綴りを誤ると、ほかのサービスのホスト名を奪うおそれがある。
  例えば API の `natueve-api.natuportal.org` は、同じアカウントの中継用 Worker の Custom Domain にする方針になっている（NatuEve_API ADR-0034）。
  割り当てるホスト名の綴り、そのホスト名に既存の DNS レコードがないこと、ほかの Worker の Custom Domain に割り当てられていないことを確かめてから割り当てる。
- **`wrangler.jsonc` の `routes` に Custom Domain を書かない。** 書くと、CI（対話できない環境）では既存の DNS レコードやほかの Worker への割り当てが、
  確認なしで上書きされる（wrangler は `override_existing_dns_record` と `override_existing_origin` を `true` にする。wrangler 4.150.0）。
  また、Custom Domain の割り当てには対象ゾーンの Zone > Workers Routes > Write が必要で（[Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/)）、
  CI のトークンにこの権限を付けることになる。
- **外すときもダッシュボードで削除する。** `routes` に Custom Domain がなければ wrangler は Custom Domain を付け替える API を呼ばないため（読み取りの一覧は呼ぶことがある。上の「割り当て方法」）、デプロイでは外れない。
  外したら、`https://natueve-web.natuportal.org` が Worker に割り当たっていないことを確認する。

## 環境変数

接続先の変数（`NEXT_PUBLIC_API_BASE_URL`・`NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_ANON_KEY`）とデプロイ用のトークンは、
GitHub Actions の Environment に置く（ADR-0003）。検証用は `staging`、本番用は `production` の Variables/Secrets に、同じ変数名で置く。
デプロイに使う値はリポジトリの Variables/Secrets には置かない（今の `ci.yml` の品質チェックのビルドが読むリポジトリの Variables は、デプロイには使わない）。
ビルド時のフラグ（`NEXT_PUBLIC_USE_MSW`・`USE_DEV_ASSETS`）は Environment に置かず、ワークフローの `env:` に固定する。
`NEXT_PUBLIC_*` と `USE_DEV_ASSETS` はビルド時に反映されるため、本番と検証で値が違う場合はそれぞれの値でビルドし直す（使い回さない。ADR-0003）。

- 検証デプロイのジョブは `environment: staging`、本番デプロイのジョブは `environment: production` を指定する。
  Environment の Variables/Secrets は、その Environment を参照するジョブだけが使える。
- **`staging`・`production` は、デプロイのワークフロー（#330）を main に入れる前に管理者が作り、保護ルールを設定しておく**。
  存在しない Environment を参照して実行すると、保護ルール・Secrets なしの Environment が自動で作られるため、自動作成に頼らない。
  設定する内容・`gh api` での確認・最初の実行での確認は ADR-0003 決定 3 を参照。
- **Environment に変数を定義し忘れると、リポジトリの同じ名前の変数が使われる**（同じ名前が複数のレベルにあると Environment が優先される。
  [Variables](https://docs.github.com/en/actions/reference/workflows-and-actions/variables)）。
  今の `ci.yml` はビルドでリポジトリの Variables の `NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_ANON_KEY` を参照している
  （2026-10-26 時点でリポジトリの Variables は 0 件で、空のままビルドしている）。
  ここに本番の値を置くと、`staging` に定義し忘れたときに検証環境が本番の Auth に繋がる（ADR-0003 決定 5 の前提が崩れる）。
  埋め込まれた値は実行時には気づけない。そのため次の 2 つで防ぐ（#330 で実装）。
  - リポジトリと Organization の Variables には、本番の `NEXT_PUBLIC_*` を置かない。
  - デプロイのジョブではビルドの前に、`NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_API_BASE_URL` がその環境の接続先
    （検証デプロイなら検証用、本番デプロイなら本番用）を指していることを確かめ、違えば失敗させる。
    期待値はワークフローに書く（どちらもブラウザに渡る公開の値で、秘密ではない）。
    期待値を同じ名前の変数から取ると、定義し忘れたときにリポジトリの値どうしを比べることになり、気づけない。

### アプリ用（ビルド時に使う変数）

ビルド時に使う。`NEXT_PUBLIC_*` はアプリへ埋め込まれ、ブラウザに渡る。本番と検証で接続先が違う変数は、環境ごとに値を分ける。
`USE_DEV_ASSETS` はビルド時に `next.config.ts` だけが参照し、アプリには埋め込まれない（クライアントの JS にも渡らない）。
本番の値は #329 で `production` の Environment に設定する。
#329 の受け入れ基準は ADR-0003 に合わせて更新済みである（`BUN_VERSION` は使わず。下記「ビルドに使うツールの版」）。
`NEXT_PUBLIC_USE_MSW`・`USE_DEV_ASSETS` はワークフローの `env:` に固定する（下の表）。

Environment に置く変数（接続先）:

| 変数 | 本番の値 | 検証環境の値 | 備考 |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://natueve-api.natuportal.org` | 検証用 API のオリジン（NatuEve_API ADR-0036 の検証環境） | NatuEve_API の本番オリジン（API の中継用 Worker の Custom Domain。NatuEve_API ADR-0034）。検証環境の値は #330 で決める |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトの URL | 検証用プロジェクトの URL（NatuEve_API ADR-0036 と同じ検証用プロジェクト。#332 の検証版の登録が必要） | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の公開キー（anon キー） | 検証用プロジェクトの公開キー | ブラウザに渡る前提の値 |

Environment に置かず、ワークフローの `env:` に固定するフラグ:

| 変数 | 本番の値 | 検証環境の値 | 備考 |
|---|---|---|---|
| `NEXT_PUBLIC_USE_MSW` | `false` | `false` | 本番・検証ともモックを使わない。`true` のときだけ画像最適化のモック用取得元（picsum.photos・i.pravatar.cc）を許可する（#327）。ワークフローの `env:` に `"false"` を固定する（#330 で実装） |
| `USE_DEV_ASSETS` | 未設定（または `false`） | `true` | `true` のときだけ、`next.config.ts` の `remotePatterns` にローカル開発・検証環境用の R2 の公開ドメイン `assets-dev.natuportal.org`（NatuEve_API ADR-0039）を、本番と同じ `pathname`・`search`・`port` の制限付きで加える（#353・#351）。未設定・`false` では許可しない。ジョブごとにワークフローの `env:` に固定する（検証ジョブは `true`、本番ジョブは立てない。#330 で実装）。本番のビルドで立てると、本番の画像最適化が開発用バケットの画像も変換するようになる |

- 値を変えたら再ビルドが必要。`USE_DEV_ASSETS` は `next.config.ts` の `images.remotePatterns` へビルド時に反映され、実行時には変えられない。
- ローカル開発は従来どおり `.env.local` を使う。Workers のランタイムで確認する場合は `.dev.vars`（`NEXTJS_ENV=development`）を使う。
  どちらもコミットしない。
  - ローカル開発・`bun run preview` では、`.env.local` に `USE_DEV_ASSETS=true` を設定する（`.env.example` の既定）。
  - `.dev.vars` は Worker の実行時変数なので、`USE_DEV_ASSETS` には効かない。
- 検証環境で `assets-dev.natuportal.org` を表示するには `USE_DEV_ASSETS=true` でビルドする必要がある。そのビルドを本番にも出すと
  本番の許可リストに `assets-dev.natuportal.org` が入るため、環境ごとにビルドする。検証環境での表示確認は、環境ができてから行う（NatuEve_API#219）。

### デプロイ用（Secrets・Variables）

| 名前 | 置き場所 | 備考 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | `staging`・`production` の Secrets（それぞれ別のトークン） | 権限は次の「Cloudflare の API トークン」を参照。デプロイのステップの `env:` にだけ渡す（ビルドのステップには渡さない。後述の「ビルドとデプロイ」） |
| `CLOUDFLARE_ACCOUNT_ID` | `staging`・`production` の Variables（秘密ではない） | wrangler は `account_id` がないと `/accounts`・`/memberships` からアカウントを探し、見つからなければ失敗する（wrangler 4.150.0）。Worker 単位のトークンでこれが通るかは確認していないため、明示して渡す |

### Cloudflare の API トークン

検証用と本番用でトークンを分ける（ADR-0003 決定 3）。どちらも、Individual Workers（Worker 単位）のスコープで対象 Worker の Editor だけにする。

| トークン | 付ける権限 | 付けない権限 |
|---|---|---|
| 検証用（`staging`） | 検証用 Worker の Editor | アカウント単位の Workers の権限、ゾーンの Workers Routes Write、R2・KV など Workers 以外の書き込み権限 |
| 本番用（`production`） | 本番 Worker の Editor | 同上 |

- Worker 単位の Editor は、既存の Worker の更新・デプロイはできるが、作成と削除はできない
  （"Cannot create or delete Workers." "Creating new Workers requires product-level `Admin` access."）。
  検証用・本番用の Worker の初回作成は、CI のトークンでなく管理者が行う。
- ルートの追加・変更・削除には、Worker の Editor に加えて、対象ゾーンの Workers Routes Write が要る。
  Custom Domain は Worker 単位のロールにまだ対応していない（"Custom Domains do not currently support per-Worker roles."）。
  出典: [Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/)
- **どちらのトークンにもゾーンの Workers Routes Write を付けない**: この権限はゾーン全体に効く。
  検証用に付けると本番のドメインを検証用 Worker に向け替えて承認を迂回でき、本番用に付けると API のホスト名（`natueve-api.natuportal.org`）を
  本番フロントの Worker に付け替えて、API への通信を横取りできてしまう。Custom Domain は管理者がダッシュボードで割り当てる（上の「割り当て方法」）。
- **どちらのトークンにもアカウント単位の Workers の権限を付けない**: 付けると、同じアカウントにある API の中継用 Worker（NatuEve_API ADR-0034）も書き換えられる。
- 「Edit Cloudflare Workers」テンプレートは、アカウント単位の Workers Scripts Write に加えて R2・KV の書き込みも含むため
  （[API token templates](https://developers.cloudflare.com/fundamentals/api/reference/template/)）、検証用・本番用のどちらにも使わない。
  今あるこのテンプレートのトークンは、新しいトークンに切り替えた後に失効させる（#330）。
- **未確認（#330 で実機確認）**: wrangler 4.150.0 の `deploy` は、Editor だけのトークンで通るか公式に記載のない API を呼ぶ。
  - デプロイのたびに、workers.dev の設定の API（`GET`・`POST .../workers/scripts/{name}/subdomain`）を呼ぶ。
  - 最後にダッシュボードから変更された Worker（`last_deployed_from` が `dash`。ダッシュボードで作った直後など）へのデプロイでは、ダッシュボード側の設定を取りに 6 本の `GET` を並べて呼ぶ
    （アカウント単位の Custom Domain の一覧・ルート・バインディング・workers.dev の設定・サービスのメタデータ・Cron。`fetchWorkerConfig`）。
    1 本でも失敗するとデプロイが止まる。Custom Domain は Worker 単位のロールに未対応のため、ここで止まるおそれがある。

  次を実機で確かめてから、トークンの権限を確定する。
  - 確認は、管理者が本番・検証と同じくダッシュボードで作った使い捨ての Worker と、未使用のダミーのサブドメインで行う
    （wrangler で作った Worker では初回のデプロイの経路を通らず、確認にならない）。本番・検証の Worker とホスト名では試さない
    （公開の条件（「割り当てる時期」）がそろう前に公開してしまうのを避けるため）。終わったら、使い捨ての Worker・Custom Domain・DNS レコードを削除する。
  - 通ること: 使い捨ての Worker の Editor だけのトークンで、`"routes": []`・`"workers_dev": false`・`"preview_urls": false` の設定を、
    作成直後の 1 回目と 2 回目の両方でデプロイできるか。
  - 割り当てが残ること: 管理者がダミーのサブドメインをダッシュボードで Custom Domain に割り当てた後にもう一度デプロイし、
    デプロイが通り、割り当てが残るか（「割り当て方法」の「デプロイでは変わらない」の裏付け）。
  - 拒否されること: 同じトークンで、ダミーのサブドメインを使い捨ての Worker の Custom Domain に付けようとして、拒否されるか。
    拒否されなければ、Worker 単位の Editor だけでドメインを付け替えられることになり、承認の迂回を防げない。
    その場合は CI のトークンでの自動デプロイを見直す（ADR-0003 を改める）。
  - 1 回目のデプロイ、または Custom Domain を割り当てた後のデプロイが通らない場合は、管理者が Worker を作る・変えるときの手順を変える
    （例: アプリのビルドではない仮のスクリプトを管理者の権限で wrangler から一度デプロイして作る。この場合は ADR-0003 決定 3 の
    「Worker の新規作成は管理者がダッシュボードで行う」も改める）か、ADR-0003 を見直す。どちらにするかは実機の結果を見て #330 で決める。
  - 通らない API があった場合は、それに要る権限を確かめる。たとえば `fetchWorkerConfig` のルートの取得には Zone > Workers Routes > Read が要る可能性がある。
    その場合は Read だけを足し、Write は付けない（Read ではルートを変えられない）。足した後、初回・2 回目・Custom Domain を割り当てた後のデプロイをもう一度確かめる。
    足してよいのは、上の表の「付けない権限」に当たらない Read だけにする。要る権限が表の「付けない権限」に当たる場合
    （例: アカウント単位の Workers の Read）は権限を広げず、一つ上の項目（手順を変えるか ADR-0003 を見直す）に従う。
  - 失敗がコードのアップロードの後に起きる場合もあるため、成否は wrangler の終了コードとエラーの内容で判定する。

### ビルドに使うツールの版

環境変数ではなく、ワークフローと設定ファイルで固定する。検証と本番で同じ版を使い、同じコミットからのビルドの同一性を保つ（ADR-0003）。

| ツール | 版 | 固定する場所 |
|---|---|---|
| Bun | `1.2.21` | `oven-sh/setup-bun` の `bun-version`（`package.json` の `packageManager` と合わせる） |
| Node.js | `24.22.1` | `actions/setup-node` の `node-version-file: .nvmrc` |

- 今の `ci.yml` もこの 2 つで固定している。デプロイのジョブも同じ指定にする（#330）。

## ビルドとデプロイ

- ローカル開発は従来どおり `bun run dev`（`next dev`）。
- Workers のランタイムでの確認とデプロイには、OpenNext の `preview`・`deploy` スクリプトを `package.json` に追加して使う。
  OpenNext のビルドは内部で `build` スクリプト（`next build`）を呼ぶ。
- **デプロイのジョブの GitHub 側の権限を絞る**（ADR-0003 決定 3）: `permissions: contents: read` を明示し、`actions/checkout` は `persist-credentials: false` にする。
  使う Action はコミット SHA で固定する。ジョブ単位の `permissions` は品質チェックのジョブから引き継がれないため、明示しないとリポジトリの既定（2026-10-26 時点で read）になる。
- **CI では `bun run deploy` を使わない。** `deploy` スクリプトはビルドとデプロイを続けて実行するため、トークンがビルド（`next build` や依存パッケージのコード）にも渡る。
  ビルドは `opennextjs-cloudflare build`（トークンを渡さない）、デプロイは `opennextjs-cloudflare deploy`（検証は `--env staging`。トークンを渡す）と、ステップを分けて実行する
  （`opennextjs-cloudflare deploy` はビルドしない）。同じジョブのステップはファイルを共有するため、これはトークンの露出を減らすだけで、
  主な防御はトークンの権限の絞り込みである（「Cloudflare の API トークン」。ADR-0003 決定 3）。
- **ローカルからは `bun run deploy` を実行しない。** Next.js は本番ビルドでも `.env.local` を読み込み
  （読まないのは test のときだけ）、`NEXT_PUBLIC_*` と `USE_DEV_ASSETS` はビルド時に反映されるため、
  ローカルの値（例: `NEXT_PUBLIC_USE_MSW=true`、`USE_DEV_ASSETS=true`、ローカル API のオリジン）が本番ビルドに混入する。
  やむを得ずローカルから実行する場合は、本番の値を環境変数として明示的に渡す（`process.env` は `.env.local` より優先される）。
  その際、**`.env.local` にあるビルド時に効く値（`NEXT_PUBLIC_*` と `USE_DEV_ASSETS`）はすべて上書きする**（渡さなかった変数には `.env.local` の値が使われる。
  特に `NEXT_PUBLIC_USE_MSW=false` と `USE_DEV_ASSETS=false` を渡し忘れると、モック認証や開発用画像の許可が本番で有効になるため注意）。
  恒久対応として、#330 で CI からのデプロイに限定する。
- **本番の取得元（`assets.natuportal.org`）には `pathname`・`search`・`port` の制限を入れている（[#351](https://github.com/GokujyouKaisennDonnburi/NatuEve_Web_Frontend/issues/351)）。** 値は[画像最適化](#画像最適化)を参照。
  開発用の `assets-dev.natuportal.org` にも同じ制限を付けている（キー形式は本番と同じ）。この制限を外したり広げたりしたまま本番へデプロイしない。
  本番のビルド環境では、開発用の取得元を次のように外す。
  - `USE_DEV_ASSETS` が `true` 以外（未設定・`false` を含む）なら、`assets-dev.natuportal.org` を許可しない。
  - `NEXT_PUBLIC_USE_MSW` が `true` 以外（未設定・`false` を含む）なら、picsum.photos・i.pravatar.cc を許可しない。
  - placehold.co・example.com は削除済み。
  この除外と `pathname`・`search`・`port` の制限は `src/__tests__/nextConfigImageHosts.test.ts` で検証している。
  **`NEXT_PUBLIC_USE_MSW=true` でビルドした環境は公開しない。** モック用の取得元（picsum.photos・i.pravatar.cc）は `pathname` を絞っておらず、
  任意の画像を変換できるため。
  変換枠（ユニーク変換/月）の使用量はアカウント単位で分析・集計される（枠の共有範囲についての公式の明記は確認できていない）ため、
  プレビュー経由でも本番の枠を消費しうる前提で扱う。
- **`natuportal.org` ゾーンの Images > Transformations が無効であることをデプロイ前に再確認する（#334）。**
  有効な場合、`/cdn-cgi/image/...` は `/_next/image` を通らず `remotePatterns` が効かず、同ゾーンの
  `assets.natuportal.org`・`assets-dev.natuportal.org` の画像を誰でも変換できる。
- **`/_next/image*` のキャッシュ方針をデプロイ前に決めて実測する。** zone の Cache Rule は Worker の応答には効かないため、
  Workers Cache を有効化するか（課金の試算が必要）、キャッシュ不要と確認する。本番相当環境で `curl -I` により
  `Cache-Control`・`cf-cache-status` を実測する。詳細は[画像最適化](#画像最適化)を参照。
- Bun はパッケージマネージャーとしてだけ使う（`--bun` フラグは禁止、`bunx` は可）。
- Workers Builds は使わない（ADR-0003）。

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
- 許可する画像の取得元:
  - R2 の公開ドメイン `assets.natuportal.org` は、API が保存するイベント・レポートの画像だけを許可する（#351）。
    - `pathname`: `/natueve/events/images/+([0-9a-f-]).@(jpg|png)`・`/natueve/reports/images/+([0-9a-f-]).@(jpg|png)`。
      NatuEve_API の `buildFinalKey`（`natueve/{events|reports}/images/{uuid}{.jpg|.png}`。UUID は小文字）に合わせる。
      ファイル名を UUID の文字と拡張子に限るため、`%2F`・`%5C` のようにエンコードした区切りを含む URL や、JPEG・PNG 以外の拡張子も通らない
      （`*` にすると 1 階層の任意の文字列に一致し、`..%2F..%2Ftmp%2F...` も通る。R2 がこれをどう解決するかは確かめていない）。
      書き方は Next.js の glob（picomatch）の extglob で、ビルド時に正規表現になり、OpenNext もその正規表現で判定する。
    - `search`: `""`（クエリ付きの URL は許可しない）。API の画像の URL は `R2_PUBLIC_BASE_URL + "/" + キー` で、クエリが付かない
      （NatuEve_API の `internal/service/object_url.go`）。末尾が `?` だけの URL は、URL の仕様で `search` が空になるため通る
      （画像の中身は同じで、別に数えられたとしても 1 画像あたり 1 通り増えるだけ）。
    - `port`: `""`（既定のポート 443 だけを許可する）。Cloudflare を通るホスト名は 8443 などの HTTPS の別ポートでも応答するため、
      未設定だとポート違いの URL も許可され、別の変換として数えられるおそれがある（別に数えられるかは確認していない。安全側に倒している）。
    一時領域（`natueve/tmp/`）・PDF（`natueve/*/documents/`）・ほかのプロダクトの画像は変換できない。
    クエリを許すと、正しい画像の URL にクエリを付けるだけで別の変換として無料枠を消費できるおそれがあるため、`search` も絞る
    （クエリ違いがユニーク変換として別に数えられるかは確認していない。安全側に倒している）。
    バケットは本番と開発で分けた（NatuEve_API ADR-0039）が、キーの形式は同じのため、開発用の `assets-dev.natuportal.org` にも同じ制限を付ける。
    API が配信ドメイン（`R2_PUBLIC_BASE_URL`）やキーの形式を変えるときは、`next.config.ts` の `hostname`・`pathname` も合わせて変える。
  - Google のプロフィール画像（`lh3.googleusercontent.com`）は許可しない（#351）。アバターは `next/image` の `unoptimized` で表示し、
    画像最適化を通さない（`GlobalUserAvatar`・`ProfileHeader`・`EventCard`）。Google のアバターの URL は末尾（例: `=s96-c`）でサイズを
    変えられ、ほかの人のアバターも含めて有効な画像の URL をいくらでも作れるため、`pathname` では変換の数を抑えられない。
    `unoptimized` を外してアバターを最適化に通す場合は、この点を踏まえて改めて検討する。
  - ローカル開発・検証環境用の R2 の公開ドメイン `assets-dev.natuportal.org`（NatuEve_API ADR-0039）は `USE_DEV_ASSETS=true` のビルドでのみ許可する（#353。上の「環境変数」）。
  - picsum.photos・i.pravatar.cc は `NEXT_PUBLIC_USE_MSW=true` のビルドでのみ許可する（`pathname` は絞らない。このビルドは公開しない）。
  - placehold.co・example.com は削除済み。
  本番ビルド（`USE_DEV_ASSETS`・`NEXT_PUBLIC_USE_MSW` がどちらも `true` 以外。未設定・`false` を含む）には
  開発用・モック用の取得元が入らない（ADR-0003 決定 4。`src/__tests__/nextConfigImageHosts.test.ts` で設定値を検証）。
  許可していない URL を `/_next/image` に渡すと、400（`"url" parameter is not allowed`）を返す（#351 で `preview` で確認）。
  取得元を絞らないと、許可した取得元の任意の画像を誰でもこの最適化を通して変換でき、
  無料枠（月 5,000 ユニーク変換）を消費する。超過すると新規変換が `9422` で失敗して画像が表示されなくなる。
  Free プランのままなら超過分の課金はない（課金が発生するのは Images Paid を契約した場合。
  バインディング経由の `9422` の挙動は上記のとおり未確認）。
- ローカル確認: API の `R2_PUBLIC_BASE_URL` を `https://assets-dev.natuportal.org` にし、フロントの `.env.local` に
  `NEXT_PUBLIC_USE_MSW=false`・`USE_DEV_ASSETS=true`・`NEXT_PUBLIC_API_BASE_URL=http://localhost:8085` を設定する。
  `bun run dev` で `/event-list`・`/event/<id>`（詳細・レポート）を開き、画像が表示されることと
  `/_next/image?url=...` が 200 を返すことを確認する。検証環境での確認は環境ができてから行う（NatuEve_API#219）。
- 補足: OpenNext 1.20.11 はリダイレクト先 URL を `remotePatterns` で再検証しない（初回 URL のみ検証。
  例: `picsum.photos` は `fastly.picsum.photos` へリダイレクトする）。許可する取得元はリダイレクト先も含めて確認する。
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
   割り当て（管理者がダッシュボードで行う）は、「割り当てる時期」の条件がそろってから行う。
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
4. **検証環境の API の接続先**: 方針は解決済み（ADR-0003）。main へのマージで検証環境へ自動デプロイし、本番へは承認後に同じコミットから本番用にビルドしたものを出す。
   検証環境は本番と同じ構成で固定オリジンを持ち、検証用 API・検証用 Auth に繋ぐ。実装は #330 で行う。
5. **CI/CD**: 方針は解決済み（ADR-0003）。GitHub Actions で、main へのマージで検証環境へ自動デプロイし、本番へは `production` 環境の承認後にデプロイする。
   Workers Builds の Git 連携は使わない。実装は #330 で行う。
   #330 の受け入れ基準は ADR-0003 に合わせて更新済みである（GitHub Actions の採用、「検証環境（`staging`）の変数の値を決める」への書き換え。#329 も同様。上の「環境変数」）。
   残る未決は、ブランチごとのプレビュー環境（下記 7.）と、検証環境の変数の値（上の「環境変数」）・検証用 Worker の名前・検証用サブドメイン名・検証用の Custom Domain の割り当て時期（ADR-0003 決定 4）である。
6. **API 側の CORS**: 一部解決済み。残っている作業は次のとおり。
   - `http://localhost:8787`（`preview` の wrangler 既定ポート）の許可は NatuEve_API #224 で対応（**マージ後に有効**）。
   - 本番のオリジン `https://natueve-web.natuportal.org`（#328 で決定。上の「独自ドメイン」を参照）を、API 側の環境変数 `CORS_ALLOW_ORIGINS` に設定する（API はワイルドカード非対応、NatuEve_API ADR-0033）。
   - 検証環境のオリジン（ADR-0003。サブドメイン名は #328 と合わせて決める）も、検証用 API の `CORS_ALLOW_ORIGINS` に設定する（API 側の作業）。
   - 検証環境のオリジンを、R2 のローカル開発用のバケットの CORS にも加える（NatuEve_API ADR-0039。API 側の作業）。
   - GitHub Actions でブランチごとのプレビュー環境を設ける場合は、URL が変わるたびに API の `CORS_ALLOW_ORIGINS` と
     Supabase Auth のリダイレクト許可への登録が必要になる（API はワイルドカード非対応）。扱いは #330 で決める。
7. **ブランチごとのプレビュー環境の API の接続先**: 未決（#330 で決める）。設ける場合の CORS とリダイレクト許可の扱いは上記 6. を参照。

## 参考（料金・仕様の出典）

- OpenNext: [Cloudflare](https://opennext.js.org/cloudflare) / [Get Started](https://opennext.js.org/cloudflare/get-started) / [Environment variables](https://opennext.js.org/cloudflare/howtos/env-vars) / [Image optimization](https://opennext.js.org/cloudflare/howtos/image)
- Cloudflare Workers: [Pricing](https://developers.cloudflare.com/workers/platform/pricing/) / [Limits](https://developers.cloudflare.com/workers/platform/limits/) / [Static Assets の課金](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- Cloudflare の権限: [Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/) / [API token templates](https://developers.cloudflare.com/fundamentals/api/reference/template/)
- GitHub Actions: [Variables（優先順位）](https://docs.github.com/en/actions/reference/workflows-and-actions/variables) / [Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments) / [Concurrency](https://docs.github.com/en/actions/using-jobs/using-concurrency) / [Changelog 2026-05-07: concurrency の `queue: max`](https://github.blog/changelog/2026-05-07-github-actions-concurrency-groups-now-allow-larger-queues)
- Cloudflare Workers Cache: [Workers Cache](https://developers.cloudflare.com/workers/cache/) / [Configuration（Cache-Control なしの既定 TTL）](https://developers.cloudflare.com/workers/cache/configuration/) / [Limitations（zone の設定は無効）](https://developers.cloudflare.com/workers/cache/limitations/)
- Cloudflare Images: [Pricing](https://developers.cloudflare.com/images/pricing/) / [Optimize with Workers](https://developers.cloudflare.com/images/optimization/binding/) / [Troubleshooting（9422）](https://developers.cloudflare.com/images/reference/troubleshooting/) / [Changelog 2026-07-01: バインディングの課金単位](https://developers.cloudflare.com/changelog/post/2026-07-01-binding-unique-transformations/)
