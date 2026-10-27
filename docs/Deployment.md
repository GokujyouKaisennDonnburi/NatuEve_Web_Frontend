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
| **GitHub Actions（Environments）** | ビルドとデプロイ（検証環境は自動、本番は承認後） | 実装済み（検証環境 #330、本番 #362）。下の「CI/CD」 |

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
| `services` | `WORKER_SELF_REFERENCE`（自分自身の Worker 名を指定。`env.staging` では検証用の Worker 名） |
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
  ただし、読み取りの一覧（アカウント単位の Custom Domain の一覧）は呼ぶことがある。Worker 単位の Editor だけのトークンでも通ることを実機で確かめた（下の「Cloudflare の API トークン」）。
- `natuportal.org` のゾーンは、デプロイ先と同じ Cloudflare アカウントにある（Active。2026-10-22 時点）。
  Custom Domain の DNS レコードと証明書は Cloudflare が作る。
- workers.dev の URL と、バージョンごとの Version URL（旧称 Preview URL。`wrangler.jsonc` の `preview_urls`）は、
  `wrangler.jsonc` の最上位と `env.staging` の両方で `"workers_dev": false` と `"preview_urls": false` を明示して無効にしている（#330）。Custom Domain を割り当ててもこの 2 つは無効のまま。
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
workers.dev の URL と Version URL での公開は、これとは別に `workers_dev` と `preview_urls` で止めている（#330）。

- #342（OpenNext のビルドが失敗する問題）が解決している（PR #345 で解決済み）。
- CI から本番へデプロイできる（#362 で本番のデプロイのジョブを入れた。承認を経て本番の Worker に出せることを、マージ後の実行で確かめてから割り当てる。後述の「CI/CD」）。
  ローカルからはデプロイしない（後述の「ビルドとデプロイ」）。
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
  検証用の URL は開発の Auth 用プロジェクト側で管理し、本番には入れない（下の「検証環境」）。
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

### 検証環境

検証環境の名前は、API 側（`natueve-api-stg.natuportal.org`・`natueve-api-relay-stg`）に揃えて `-stg` を付ける（#330）。

| 項目 | 値 | 使う場所 |
|---|---|---|
| Worker の名前 | `natueve-web-frontend-stg` | `wrangler.jsonc` の `env.staging` の `name`。管理者がダッシュボードで作る |
| 検証環境のオリジン | `https://natueve-web-stg.natuportal.org` | 検証用 API の `CORS_ALLOW_ORIGINS`（NatuEve_API の `deploy/cloud-run/staging.yaml`）、R2 のローカル開発用のバケットの CORS（NatuEve_API ADR-0039） |
| OAuth のリダイレクト先 | `https://natueve-web-stg.natuportal.org/auth/callback` | ローカル開発の Auth 用プロジェクトの Redirect URLs（検証環境は開発と Auth を共有する。NatuEve_API ADR-0041） |

- 検証環境の Auth は、ローカル開発と同じ Auth 用プロジェクトを使う。ADR-0003 決定 5 の「NatuEve_API ADR-0036 の検証用プロジェクト」は、
  NatuEve_API ADR-0041（ADR-0036 の決定事項 5 を置き換えた）により、この開発の Auth 用プロジェクトになった。
  そのプロジェクトの Site URL は変えず、Redirect URLs に上のリダイレクト先を加える。
  本番の Auth には検証用の URL を入れない（上の「割り当てる時期」）。
- Custom Domain は、本番と同じく管理者がダッシュボードで割り当てる（上の「割り当て方法」「注意」と同じ手順）。
  次がそろってから割り当てる。
  - CI から検証用の Worker へのデプロイが通っている（下の「CI/CD」）。
  - 上のオリジンを検証用 API の `CORS_ALLOW_ORIGINS` と R2 のローカル開発用のバケットの CORS に、リダイレクト先を開発の Auth 用プロジェクトの Redirect URLs に登録している（API 側・Supabase の作業）。
- 割り当てた後の CI のデプロイで、Custom Domain が外れずに応答することを確かめた（2026-10-27。#363 のマージ後の実行で `Deploy (staging)` が成功し、割り当ては生きたまま。下の「Cloudflare の API トークン」）。
- 割り当て後、本番と同じ 4 つ（トップページ・API の呼び出し・ログイン・画像の表示）を確かめた（2026-10-27）。
  画像の表示の確認は、#351 の実データでの確認を兼ねる（`assets-dev.natuportal.org` のキーの形式は本番と同じ）。

## 環境変数

接続先の変数（`NEXT_PUBLIC_API_BASE_URL`・`NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_ANON_KEY`）とデプロイ用のトークンは、
GitHub Actions の Environment に置く（ADR-0003）。検証用は `staging`、本番用は `production` の Variables/Secrets に、同じ変数名で置く。
デプロイに使う値はリポジトリの Variables/Secrets には置かない（`ci.yml` は、品質チェックのビルドも含めてリポジトリの Variables を参照しない。#330）。
ビルド時のフラグ（`NEXT_PUBLIC_USE_MSW`・`USE_DEV_ASSETS`）は Environment に置かず、ワークフローの `env:` に固定する。
`NEXT_PUBLIC_*` と `USE_DEV_ASSETS` はビルド時に反映されるため、本番と検証で値が違う場合はそれぞれの値でビルドし直す（使い回さない。ADR-0003）。

- 検証デプロイのジョブは `environment: staging`、本番デプロイのジョブは `environment: production` を指定する。
  Environment の Variables/Secrets は、その Environment を参照するジョブだけが使える。
- **`staging`・`production` は、デプロイのワークフロー（#330）を main に入れる前に管理者が作り、保護ルールを設定しておく**。
  存在しない Environment を参照して実行すると、保護ルール・Secrets なしの Environment が自動で作られるため、自動作成に頼らない。
  設定する内容・`gh api` での確認・最初の実行での確認は ADR-0003 決定 3 を参照。
- **Environment に変数を定義し忘れると、リポジトリの同じ名前の変数が使われる**（同じ名前が複数のレベルにあると Environment が優先される。
  [Variables](https://docs.github.com/en/actions/reference/workflows-and-actions/variables)）。
  #330 より前の `ci.yml` は、品質チェックのビルドでリポジトリの Variables の `NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_ANON_KEY` を参照していた
  （リポジトリの Variables は 0 件で、空のままビルドしていた）。#330 で参照をやめた（2026-10-27 時点でリポジトリの Variables は 0 件）。
  ここに本番の値を置くと、`staging` に定義し忘れたときに検証環境が本番の Auth に繋がる（ADR-0003 決定 5 の前提が崩れる）。
  埋め込まれた値は実行時には気づけない。そのため次の 2 つで防ぐ（#330。`ci.yml` の「Check connection variables」）。
  - リポジトリと Organization の Variables には、本番の `NEXT_PUBLIC_*` を置かない。
  - デプロイのジョブではビルドの前に、`NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_API_BASE_URL` がその環境の接続先
    （検証デプロイなら検証用、本番デプロイなら本番用）を指していることを確かめ、違えば失敗させる。
    期待値はワークフローに書く（どちらもブラウザに渡る公開の値で、秘密ではない）。
    期待値を同じ名前の変数から取ると、定義し忘れたときにリポジトリの値どうしを比べることになり、気づけない。

### アプリ用（ビルド時に使う変数）

ビルド時に使う。`NEXT_PUBLIC_*` はアプリへ埋め込まれ、ブラウザに渡る。本番と検証で接続先が違う変数は、環境ごとに値を分ける。
`USE_DEV_ASSETS` はビルド時に `next.config.ts` だけが参照し、アプリには埋め込まれない（クライアントの JS にも渡らない）。
本番の値は `production` の Environment に設定済み（2026-10-27。#329）で、本番のデプロイのジョブ（`deploy-production`。#362）で使う。
#329 の受け入れ基準は ADR-0003 に合わせて更新済みである（`BUN_VERSION` は使わず。下記「ビルドに使うツールの版」）。
`NEXT_PUBLIC_USE_MSW`・`USE_DEV_ASSETS` はワークフローの `env:` に固定する（下の表）。

Environment に置く変数（接続先）:

| 変数 | 本番の値 | 検証環境の値 | 備考 |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://natueve-api.natuportal.org` | `https://natueve-api-stg.natuportal.org` | API の中継用 Worker の Custom Domain（NatuEve_API ADR-0034。検証環境は `natueve-api-relay-stg`） |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tpszowxdhvthxyqorvwr.supabase.co`（本番の Auth `natueveOAuth`。上の「独自ドメイン」） | `https://mxtjfurilkrewjdwslxl.supabase.co`（ローカル開発の Auth 用プロジェクト。NatuEve_API ADR-0041） | 検証環境は、API の検証環境と同じく開発と Auth を共有する。Redirect URLs への登録は下の「検証環境」 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 本番の Auth の公開キー（anon キー） | 開発の Auth 用プロジェクトの公開キー | ブラウザに渡る前提の値 |

Environment に置かず、ワークフローの `env:` に固定するフラグ:

| 変数 | 本番の値 | 検証環境の値 | 備考 |
|---|---|---|---|
| `NEXT_PUBLIC_USE_MSW` | `false` | `false` | 本番・検証ともモックを使わない。`true` のときだけ画像最適化のモック用取得元（picsum.photos・i.pravatar.cc）を許可する（#327）。ワークフローの `env:` に `"false"` を固定する（#330） |
| `USE_DEV_ASSETS` | 未設定（または `false`） | `true` | `true` のときだけ、`next.config.ts` の `remotePatterns` にローカル開発・検証環境用の R2 の公開ドメイン `assets-dev.natuportal.org`（NatuEve_API ADR-0039）を、本番と同じ `pathname`・`search`・`port` の制限付きで加える（#353・#351）。未設定・`false` では許可しない。ジョブごとにワークフローの `env:` に固定する（検証ジョブは `true`、本番ジョブは立てない。#330）。本番のビルドで立てると、本番の画像最適化が開発用バケットの画像も変換するようになる |

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
  今あるこのテンプレートのトークンは、新しいトークンに切り替えた後に失効させる。
- **実機で確かめた（2026-10-27、#330。wrangler 4.150.0）**: Editor だけのトークンで `deploy` が通った。そのトークンで `routes` に Custom Domain を書いたデプロイは、ドメインを付けられずに失敗した。
  wrangler の `deploy` は、Editor だけのトークンで通るか公式に記載のない API を呼ぶため、マージ前に確かめた。
  - デプロイのたびに、workers.dev の設定の API（`GET`・`POST .../workers/scripts/{name}/subdomain`）を呼ぶ。
  - 最後にダッシュボードから変更された Worker（`last_deployed_from` が `dash`。ダッシュボードで作った直後など）へのデプロイでは、ダッシュボード側の設定を取りに 6 本の `GET` を並べて呼ぶ
    （アカウント単位の Custom Domain の一覧・ルート・バインディング・workers.dev の設定・サービスのメタデータ・Cron。`fetchWorkerConfig`）。
    1 本でも失敗するとデプロイが止まるため、Custom Domain が Worker 単位のロールに未対応なことで止まるおそれがあった。

  | 確かめたこと | 使った Worker・トークン | 結果 |
  |---|---|---|
  | ダッシュボードで作った直後の Worker への 1 回目のデプロイ（`"routes": []`・`"workers_dev": false`・`"preview_urls": false`） | `natueve-web-frontend-stg`（ダッシュボードで作り、一度もデプロイしていない）と、その Worker の Individual Workers Editor だけのトークン | 通った（`No targets deployed`。公開先はない） |
  | 2 回目のデプロイ | 同じ Worker（1 回目で確認用の最小のスクリプトをデプロイした後）と同じトークン | 通った |
  | 管理者がダッシュボードで Custom Domain を割り当てた後のデプロイ | 使い捨ての Worker（手元の wrangler の OAuth のログインで作られたもの。下の注意を参照）と、その Worker の Individual Workers Editor だけのトークン | 通り、割り当ても残った（「割り当て方法」の「デプロイでは変わらない」の裏付け） |
  | トークンで Custom Domain を付けようとする（`routes` に `custom_domain: true` を書いてデプロイ） | 同上 | コードのアップロードは通り、トリガーの段階で `The zone "..." does not exist on your account. [code: 10084]`（wrangler がゾーンを名前で引く段階。トークンにゾーンの権限がないため見えない）で失敗し、終了コード 1 になった。ドメインは付かず、割り当て済みの Custom Domain は残った |

  - 確かめたのは、wrangler の `routes`（`custom_domain: true`）で付けられないことまでで、Custom Domain の API にゾーン ID を直接渡したときの結果は確かめていない。
  - 成否は wrangler の終了コードとエラーの内容で判定した。失敗がコードのアップロードの後に起きると、デプロイの一部（コード）は反映される。
  - **ダッシュボードで作った Worker に Custom Domain を割り当てた後のデプロイ**: 2026-10-27 に検証環境で確かめた（本番も同じ組み合わせになる予定。本番は #328 の割り当て後に同じ確認を行う）。
    1・2 行目の Worker には Custom Domain がなく、3 行目の Worker は wrangler で作られたもの（ダッシュボードで作った直後の経路を通らない）だった。
    検証用の Custom Domain を割り当てた後の CI のデプロイ（#363 のマージ後の実行）で、割り当てが生きたままデプロイが成功することを確かめた（上の「検証環境」）。
  - 本番用のトークン（`natueve-web-frontend` の Individual Workers Editor）も、同じ権限のまま 2026-10-27 の本番のデプロイ（#363 のマージ後の実行）で確かめた。
  - 確認の後片付け: 使い捨ての Worker と、その Custom Domain・DNS レコード、使い捨ての Worker 用のトークンを削除する。
    1・2 行目の確認に使った検証用の Worker のトークンは、`staging` の `CLOUDFLARE_API_TOKEN` として使うため削除しない（`staging`・`production` のトークンは残す）。手元の wrangler の OAuth のログインは、要らなければ `wrangler logout` でログアウトする。
  - 1 回目の確認は、使い捨ての Worker ではなく検証用の `natueve-web-frontend-stg` で行った。ダッシュボードで作った直後の状態の Worker が、それしかなかったため。
    確認用の最小のスクリプト（ドメインなし・workers.dev は無効）を載せただけで、公開はしていない。CI の最初のデプロイで上書きされる。
  - トークンを作る画面では、権限ポリシーを「Workers > (対象の Worker) > Individual Workers Editor」だけにする。
    同じ画面で選べる Workers Routes Write と、「natuportal アカウント全体」のポリシー（「Edit Cloudflare Workers」テンプレートと同じ中身）は付けない。
  - 手元で wrangler を実行するときは、`CLOUDFLARE_API_TOKEN` が空だと、wrangler は `wrangler login` の OAuth のログイン（アカウントの全権限）を黙って使う。
    権限の確認やトークンでの操作では、実行の前にトークンが空でないことを確かめ、`wrangler whoami` が `Account API Token` を表示することを見る
    （#330 の確認で、トークンが空のまま実行され、OAuth のログインで Worker が新しく作られたことがあった）。

### ビルドに使うツールの版

環境変数ではなく、ワークフローと設定ファイルで固定する。検証と本番で同じ版を使い、同じコミットからのビルドの同一性を保つ（ADR-0003）。

| ツール | 版 | 固定する場所 |
|---|---|---|
| Bun | `1.2.21` | `oven-sh/setup-bun` の `bun-version`（`package.json` の `packageManager` と合わせる） |
| Node.js | `24.22.1` | `actions/setup-node` の `node-version-file: .nvmrc` |

- `ci.yml` の品質チェックのジョブもデプロイのジョブも、この 2 つで固定している（#330）。

## ビルドとデプロイ

- ローカル開発は従来どおり `bun run dev`（`next dev`）。
- Workers のランタイムでの確認とデプロイには、OpenNext の `preview`・`deploy` スクリプトを `package.json` に追加して使う。
  OpenNext のビルドは内部で `build` スクリプト（`next build`）を呼ぶ。
- **デプロイのジョブの GitHub 側の権限を絞る**（ADR-0003 決定 3）: `permissions: contents: read` を明示し、`actions/checkout` は `persist-credentials: false` にする。
  使う Action はコミット SHA で固定する。ジョブ単位の `permissions` は品質チェックのジョブから引き継がれないため、明示しないとリポジトリの既定（2026-10-26 時点で read）になる。
- **CI では `bun run deploy` を使わない。** `deploy` スクリプトはビルドとデプロイを続けて実行するため、トークンがビルド（`next build` や依存パッケージのコード）にも渡る。
  ビルドは `opennextjs-cloudflare build`（トークンを渡さない）、デプロイは `opennextjs-cloudflare deploy`（検証は `--env staging`。トークンを渡す。本番は後述の「CI/CD」の「本番のデプロイ」）と、ステップを分けて実行する
  （`opennextjs-cloudflare deploy` はビルドしない）。同じジョブのステップはファイルを共有するため、これはトークンの露出を減らすだけで、
  主な防御はトークンの権限の絞り込みである（「Cloudflare の API トークン」。ADR-0003 決定 3）。
- **ローカルからは `bun run deploy` を実行しない。** Next.js は本番ビルドでも `.env.local` を読み込み
  （読まないのは test のときだけ）、`NEXT_PUBLIC_*` と `USE_DEV_ASSETS` はビルド時に反映されるため、
  ローカルの値（例: `NEXT_PUBLIC_USE_MSW=true`、`USE_DEV_ASSETS=true`、ローカル API のオリジン）が本番ビルドに混入する。
  やむを得ずローカルから実行する場合は、本番の値を環境変数として明示的に渡す（`process.env` は `.env.local` より優先される）。
  その際、**`.env.local` にあるビルド時に効く値（`NEXT_PUBLIC_*` と `USE_DEV_ASSETS`）はすべて上書きする**（渡さなかった変数には `.env.local` の値が使われる。
  特に `NEXT_PUBLIC_USE_MSW=false` と `USE_DEV_ASSETS=false` を渡し忘れると、モック認証や開発用画像の許可が本番で有効になるため注意）。
  検証環境・本番とも CI からデプロイする（検証環境 #330、本番 #362。後述の「CI/CD」）。
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
- Bun はパッケージマネージャーとしてだけ使う（`--bun` フラグは禁止、`bunx` は可。ただし CI の `opennextjs-cloudflare` は `bunx` を使わず `node_modules/.bin` から呼ぶ。後述の「CI/CD」）。
- Workers Builds は使わない（ADR-0003）。

## CI/CD（GitHub Actions）

ビルドとデプロイは `.github/workflows/ci.yml` で行う（#330。方針は ADR-0003）。

| ジョブ | 起動 | Environment | 内容 |
|---|---|---|---|
| `quality` | PR・main への push | — | Lint・Format・Typecheck・Test・シェルスクリプトの検査（`bash -n`・`shellcheck -S warning`）。ビルドは PR だけで、デプロイと同じコマンドの `opennextjs-cloudflare build --env staging`（トークンなし。接続先の値（`NEXT_PUBLIC_API_BASE_URL`・`NEXT_PUBLIC_SUPABASE_*`）は空文字で明示し、`.env.production`（.gitignore の外でコミットされうる）に接続先を書かれてもビルドに使えないようにする。値が空のため、プリレンダリングで接続先を使うとビルドが失敗して気づける。値の取り違えのようにビルドが通る誤りは main の `deploy-staging`（接続先の確認）まで分からない。成果物はデプロイしない） |
| `deploy-staging` | main への push（`quality` の後） | `staging` | 接続先の確認 → `opennextjs-cloudflare build --env staging` → main の最新かの確認 → `opennextjs-cloudflare deploy --env staging` |
| `deploy-production` | `deploy-staging` の後、承認を経て | `production`（承認が要る） | 接続先の確認 → `opennextjs-cloudflare build`（本番の値。`USE_DEV_ASSETS` は立てない）→ main の最新かの確認 → `opennextjs-cloudflare deploy`（#362） |

`quality` の表示名（`Lint / Format / Typecheck / Test / Build`）はシェルスクリプトの検査を含めていない。表示名は必須チェックの設定に紐づく可能性があるため、変更は必須チェックへの影響を確認してからにする（#362 のレビュー）。

- 起動は `pull_request` と main への `push` だけ。`workflow_run`・`pull_request_target` は使わない（ADR-0003 決定 3。起動元とデプロイするコミットがずれるため）。
  デプロイは main への push で起動した実行の中で動かす（同）ため、手動でデプロイするための `workflow_dispatch` も設けない（出し直しは下のとおり再実行で行う）。
  デプロイを含む main への push には paths フィルタを付けず、`[skip ci]` も使わない。
  出し直すときは、main の最新のコミットの実行を再実行する（古いコミットの実行は、下の「main の最新の確認」で止まる）。
- **同時実行**: ワークフロー単位の `concurrency` は、PR だけ古い実行を取り消す。main への push の実行は `github.run_id` で実行ごとに別のグループにし、取り消さない。
  デプロイのジョブはジョブ単位のグループ（`deploy-staging`・`deploy-production`）に入れ、`cancel-in-progress: false` と `queue: max` にする
  （同じ環境へのデプロイは同時に 1 つだけ。待機中のジョブを取り消さない。最大 100 件まで待機できる）。
- **接続先の確認**（「Check connection variables」）: ビルドの前に、`NEXT_PUBLIC_API_BASE_URL`・`NEXT_PUBLIC_SUPABASE_URL` が
  ワークフローに書いた期待値（ジョブの `env:` の `EXPECTED_*`）と一致するかを確かめる。`NEXT_PUBLIC_SUPABASE_ANON_KEY` は、JWT の `ref` が期待値の URL のプロジェクトと同じで `role` が `anon` か
  （`service_role` などの秘密のキーをブラウザに渡る JS に埋め込まないため。許可するのは照合できた JWT と、中身を確かめられない公開用の `sb_publishable_` のキー（警告だけ）で、それ以外は失敗させる。
  `sb_publishable_` は JWT と違って `ref` によるプロジェクトの照合ができないため、別プロジェクトのキーを設定しても、この確認では警告だけで通る。その取り違えは、その環境でログインが壊れる形で気づくことになる）、`CLOUDFLARE_ACCOUNT_ID` は空でないかを確かめる。違えば失敗させる
  （理由は上の「環境変数」）。期待値は上の「アプリ用」の表の値。
- **main の最新の確認**（「Check this run is the latest main」）: デプロイの直前に、`github.sha` が main の最新のコミットと一致するかを `gh api` で確かめ、
  一致しない・取得できないときはデプロイせずにジョブを失敗させる（ADR-0003 決定 3）。トークンは `GH_TOKEN: ${{ github.token }}`（`contents: read`）をこのステップにだけ渡す。
  検証ジョブが失敗すると、本番のジョブは `needs` により実行されず、承認の依頼も出ない。
- checkout は両方のデプロイのジョブで実行の `github.sha` を指定する（本番は検証環境に出したのと同じコミットから、本番の値でビルドし直す。成果物は使い回さない）。デプロイしたコミットはジョブのサマリーに書き出す。
- 接続先の確認と main の最新の確認は、両方のジョブで `bash .github/scripts/check-connection-variables.sh`・`bash .github/scripts/check-latest-main.sh` を呼ぶ。
  期待値の `EXPECTED_*` はジョブの `env:` で渡す。`DEPLOY_ENVIRONMENT` と確認対象の値（`NEXT_PUBLIC_*`・`CLOUDFLARE_ACCOUNT_ID`・`GH_TOKEN`）は、各ステップの `env:` で渡す。
  どちらのスクリプトも `bun install` の後に実行するため、そのステップ（依存パッケージのコードが動く）がスクリプトを書き換えうる（`check-latest-main.sh` はビルドの後にも実行する）。ただし、そのステップが乗っ取られた時点で、デプロイのステップで動く `node_modules/.bin/opennextjs-cloudflare` も書き換えられるため、増える危険は小さいとして受け入れる
  （同じジョブのステップはファイルを共有する。主な防御はトークンの権限の絞り込み。ADR-0003 決定 3）。
- Cloudflare のトークンはデプロイのステップにだけ渡す。`CLOUDFLARE_ACCOUNT_ID` は Environment の Variables から渡す（上の「デプロイ用」）。
- `opennextjs-cloudflare` は `./node_modules/.bin/opennextjs-cloudflare` で呼ぶ（bin は `#!/usr/bin/env node` で、Node.js で動く）。
  `bunx` は使わない。`bunx` は `node_modules` に見つからないと npm から同じ名前のパッケージを取って動かす。
  npm にはスコープなしの `opennextjs-cloudflare`（`@opennextjs` とは別の公開者）があり、トークンを渡すステップで第三者のコードが動きうるため。

### 本番のデプロイ

#330 では本番を承認待ちの確認用のジョブ（`approve-production`）までにし、最初の実行（2026-10-27）で承認待ちになることを確かめてから、
#362 で本番のデプロイのジョブ（`deploy-production`）に置き換えた。

- ステップは `deploy-staging` と同じ並び（接続先の確認（キーの `ref`・`role` と `CLOUDFLARE_ACCOUNT_ID` を含む）→ ビルド → main の最新の確認 → デプロイ → サマリー）。
  main の最新の確認は、承認の後、デプロイの直前に行う（承認待ちの間に main が進んでいたら出さない）。
- 期待値は本番の値（`https://natueve-api.natuportal.org`・`https://tpszowxdhvthxyqorvwr.supabase.co`）。
- `USE_DEV_ASSETS` は `"false"` と明示して立てない（`NEXT_PUBLIC_USE_MSW` は `"false"` に固定する。`.env.production` は .gitignore の外でコミットされうるため、未設定に頼らず明示する。#353・#362 のレビュー）。
- 最上位の設定を使うため、ジョブの `env:` に `CLOUDFLARE_ENV: ""` を置く（ジョブの `env:` は全ステップに継承され、空文字が設定される場合には、ビルドとデプロイの両方のステップで効く。`CLOUDFLARE_ENV` を参照しない他のステップには、空文字の変数が設定されるだけで影響はない）。
  `wrangler.jsonc` に `env` があるため、環境を指定しないと wrangler が警告を出す。`--env=""` は OpenNext 1.20.13 が空文字を捨てて wrangler に渡さないため効かない
  （`getWranglerArgs` の `args.env ? [...] : []`）。wrangler は `CLOUDFLARE_ENV` が環境変数にあれば空文字でも指定ありとみなし（`variableName in process.env`）、
  OpenNext は自分の環境変数をそのまま wrangler に渡す。手元で、空の `CLOUDFLARE_ENV` で本番用の `opennextjs-cloudflare build` が通り、
  `wrangler deploy --dry-run` で警告が出ず、`WORKER_SELF_REFERENCE` が `natueve-web-frontend` を指すことを確かめた（wrangler 4.150.0）。
  GitHub Actions が空文字の環境変数を設定するかも含めて、最初の実行（2026-10-27。#363 のマージ後の実行。コミット `e9caa6a`）で確かめた。ビルドとデプロイのログに環境を指定していないという警告は出ず、空文字が効いていた（`.env.production` に `CLOUDFLARE_ENV` を書くと、OpenNext がその値を読んで別の環境を選びかねないため、書かないこと）。
- 最初の実行で、必須承認者の承認の後に、本番の Worker `natueve-web-frontend` へのデプロイが成功することを確かめた（2026-10-27 の実行。`Uploaded natueve-web-frontend` の後、`No targets deployed` で routes には触れない。Custom Domain 未割り当てで `workers_dev`・`preview_urls` 無効のため、公開は変わらない）。
- 本番へ出しても、Custom Domain を割り当てるまでは公開されない（`workers_dev`・`preview_urls` は無効）。割り当ては「割り当てる時期」の条件がそろってから行う（#328）。

### 初期設定（管理者が行う）

存在しない Environment を参照する実行は、保護ルールなしの Environment を自動で作るため、手順 1〜5 はワークフローを main に入れる前に済ませる（ADR-0003 決定 3。手順 6 はマージ後の確認）。

1. **Cloudflare の Worker を作る**: 検証用の `natueve-web-frontend-stg`（と、まだなければ本番の `natueve-web-frontend`）をダッシュボードで作る。
   CI のトークン（Worker 単位の Editor）では Worker を作れない（上の「Cloudflare の API トークン」）。
2. **検証用・本番用のトークンを作る**: 対象の Worker の Individual Workers Editor だけにする（上の「Cloudflare の API トークン」。検証用のトークンの権限は 2026-10-27 に実機で確かめ、本番用も同日の本番のデプロイ（#363 のマージ後の実行）で確かめた）。
3. **GitHub の Environment を作る**: `staging`・`production` を作り、どちらもデプロイできるブランチを main のみにし、
   管理者による保護ルールのバイパスを無効にする。`production` には Required reviewers と Prevent self-review を設定する。
   Prevent self-review により main にマージした本人は承認できないため、承認者は少なくとも 2 人登録する（ADR-0003「トレードオフ」）。
4. **Variables・Secrets を置く**:

   | 名前 | 種別 | `staging` | `production` |
   |---|---|---|---|
   | `NEXT_PUBLIC_API_BASE_URL` | Variable | `https://natueve-api-stg.natuportal.org` | `https://natueve-api.natuportal.org` |
   | `NEXT_PUBLIC_SUPABASE_URL` | Variable | `https://mxtjfurilkrewjdwslxl.supabase.co` | `https://tpszowxdhvthxyqorvwr.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Variable | 開発の Auth 用プロジェクトの公開キー | 本番の Auth の公開キー |
   | `CLOUDFLARE_ACCOUNT_ID` | Variable | Cloudflare のアカウント ID | 同左 |
   | `CLOUDFLARE_API_TOKEN` | Secret | 検証用のトークン | 本番用のトークン |

   デプロイに使う Variables・Secrets は、リポジトリと Organization のレベルには置かない（上の「環境変数」）。AI レビュー用の `OPENCODE_API_KEY` など、デプロイに使わないものは対象外。
   `production` の値は、本番のデプロイのジョブ（`deploy-production`。#362）で使う（値の設定は #329）。
5. **設定を確かめる**: `gh api repos/{owner}/{repo}/environments/{name}` で `can_admins_bypass` が `false`、`protection_rules`（`production` は `required_reviewers` と `prevent_self_review: true`）、
   `deployment_branch_policy` を、`.../environments/{name}/deployment-branch-policies` で main のみであることを確かめる。
6. **マージ後の最初の実行で確かめる**: `deploy-staging` が検証用の Worker にデプロイし、本番のジョブが承認待ちになること。
   #330 のマージ後の実行（2026-10-27）では、確認用のジョブ（`approve-production`）が承認待ちになることを確かめ（`a494109` の実行）、
   #363 のマージ後の最初の実行（同日。`e9caa6a` の実行）では、`deploy-production` が承認待ちになり、必須承認者の承認の後に本番へのデプロイが成功することを確かめた。
   - #362 の後は、承認すると本番へデプロイされる。古い実行の承認待ちは、承認せずに却下（Reject）する（承認しても main の最新の確認で止まる。ADR-0003 決定 3）。
   - 確認用のジョブの間（#330〜#362）に承認したものがあれば、デプロイしていないコミットが `production` のデプロイの記録に成功として残っている。
     その間の記録で本番の中身を判断しない（本番の中身は Cloudflare の Worker のデプロイの履歴で確かめる）。

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
   「CI から本番へデプロイできる」の条件は、2026-10-27 の #363 のマージ後の実行で確かめた（上の「割り当てる時期」）。残りの条件の確認と割り当ては #328 で行う。
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
4. **検証環境の接続先**: 解決済み（#330）。API は `https://natueve-api-stg.natuportal.org`、Auth はローカル開発の Auth 用プロジェクト（NatuEve_API ADR-0041）。
   値は上の「環境変数」、名前とドメインは上の「検証環境」を参照。
5. **CI/CD**: 解決済み（#330・#362）。main へのマージで検証環境へ自動でデプロイし、本番は承認を経てデプロイする（上の「CI/CD」）。
   - マージ前の初期設定（上の「CI/CD」の「初期設定」）。2026-10-27 に管理者が済ませた（検証用のトークンの権限の実機確認を含む）。
   - 承認を経て本番の Worker にデプロイできること。2026-10-27 の #363 のマージ後の実行（`e9caa6a`）で、必須承認者の承認の後に本番へのデプロイが成功することを確かめた。
   - 検証環境の Custom Domain `natueve-web-stg.natuportal.org` の割り当て。2026-10-27 に管理者が割り当て、割り当て後の CI のデプロイでもドメインが生きていることを確かめた（上の「検証環境」）。
6. **API 側の CORS**: 解決済み。
   - `http://localhost:8787`（`preview` の wrangler 既定ポート）の許可は NatuEve_API #224 で対応済み（検証環境の `CORS_ALLOW_ORIGINS` を未設定にしたときの既定に含まれる）。
   - 本番のオリジン `https://natueve-web.natuportal.org` は、API の本番の `CORS_ALLOW_ORIGINS` に設定済み（NatuEve_API の `deploy/cloud-run/production.yaml`）。
   - 検証環境のオリジン `https://natueve-web-stg.natuportal.org` は、検証用 API の `CORS_ALLOW_ORIGINS`（NatuEve_API の `deploy/cloud-run/staging.yaml`）と、
     R2 のローカル開発用のバケットの CORS（NatuEve_API ADR-0039）に 2026-10-27 に追加済み。検証環境での確認（上の「検証環境」）で、CORS のエラーが出ないことも確かめた（API はワイルドカード非対応、NatuEve_API ADR-0033）。
7. **ブランチごとのプレビュー環境**: 設けない（#330 で決定）。検証環境（main へのマージ後）だけにする。
   設けると、URL が変わるたびに API の `CORS_ALLOW_ORIGINS`（ワイルドカード非対応）と Supabase Auth の Redirect URLs への登録が要る。
   必要になったら、この点を含めて改めて検討する。

## 参考（料金・仕様の出典）

- OpenNext: [Cloudflare](https://opennext.js.org/cloudflare) / [Get Started](https://opennext.js.org/cloudflare/get-started) / [Environment variables](https://opennext.js.org/cloudflare/howtos/env-vars) / [Image optimization](https://opennext.js.org/cloudflare/howtos/image)
- Cloudflare Workers: [Pricing](https://developers.cloudflare.com/workers/platform/pricing/) / [Limits](https://developers.cloudflare.com/workers/platform/limits/) / [Static Assets の課金](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- Cloudflare の権限: [Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/) / [API token templates](https://developers.cloudflare.com/fundamentals/api/reference/template/)
- GitHub Actions: [Variables（優先順位）](https://docs.github.com/en/actions/reference/workflows-and-actions/variables) / [Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments) / [Concurrency](https://docs.github.com/en/actions/using-jobs/using-concurrency) / [Changelog 2026-05-07: concurrency の `queue: max`](https://github.blog/changelog/2026-05-07-github-actions-concurrency-groups-now-allow-larger-queues)
- Cloudflare Workers Cache: [Workers Cache](https://developers.cloudflare.com/workers/cache/) / [Configuration（Cache-Control なしの既定 TTL）](https://developers.cloudflare.com/workers/cache/configuration/) / [Limitations（zone の設定は無効）](https://developers.cloudflare.com/workers/cache/limitations/)
- Cloudflare Images: [Pricing](https://developers.cloudflare.com/images/pricing/) / [Optimize with Workers](https://developers.cloudflare.com/images/optimization/binding/) / [Troubleshooting（9422）](https://developers.cloudflare.com/images/reference/troubleshooting/) / [Changelog 2026-07-01: バインディングの課金単位](https://developers.cloudflare.com/changelog/post/2026-07-01-binding-unique-transformations/)
