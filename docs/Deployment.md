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
| Cloudflare DNS | 独自ドメインの割り当て（`natueve-web.natuportal.org`。Workers の Custom Domain） | サブドメインは決定し（#328）、2026-10-27 に割り当て済み。下の「割り当てる時期」 |
| **Cloudflare Images（`IMAGES` バインディング）** | `next/image` の画像最適化 | 確定（#327） |
| **GitHub Actions（Environments）** | ビルドとデプロイ（検証環境は自動、本番は承認後） | 実装済み（検証環境 #330、本番 #362）。下の「CI/CD」 |

- 使わないサービス: Cloudflare Workers Builds（Git 連携による Cloudflare 側のビルド）。デプロイは GitHub Actions から行う（ADR-0003）。
  ダッシュボードで Git 連携を接続しない。

フロントエンドの接続先（既存）:

| 接続先 | 用途 | 呼び出し元 |
|---|---|---|
| NatuEve_API | データの取得・投稿 | ブラウザ（将来は SSR からも） |
| R2（API のバケット） | 画像・PDF のアップロード（API の presign で得た署名付き URL へ直接 PUT。`src/services/upload.ts`）、PDF の閲覧（API が返す公開 URL をブラウザが直接開く）、画像最適化の取得元 | ブラウザ（アップロード・PDF の閲覧）、Worker（画像最適化） |
| Google（`lh3.googleusercontent.com`） | アバター画像の表示（画像最適化を通さない） | ブラウザ |
| Supabase Auth | ログイン（Google OAuth） | ブラウザ |

## 構成図

```
[ブラウザ]
   │
   ├─ ページ・画像の取得 ──→ natueve-web.natuportal.org（Custom Domain）
   │                          └→ Cloudflare Workers `natueve-web-frontend`（OpenNext）
   │                               ├─ 静的ファイル（/_next/static/* と public/ 配下）: ASSETS からそのまま返す（Worker は動かない）
   │                               ├─ ページ: Next.js が SSR で返す
   │                               └─ 画像（/_next/image）: R2 の画像は公開ドメイン（assets.natuportal.org）、
   │                                    静的 import（ロゴ等）は ASSETS から取得し、
   │                                    Cloudflare Images（IMAGES バインディング）で変換して返す
   │
   ├─ データの取得・投稿 ──→ NatuEve_API（natueve-api.natuportal.org。NEXT_PUBLIC_API_BASE_URL）
   │
   ├─ 画像・PDF のアップロード ──→ R2（API の presign で得た署名付き URL へ直接 PUT）
   │
   ├─ PDF の閲覧 ──→ R2 の公開ドメイン（assets.natuportal.org）
   │
   ├─ アバターの表示 ──→ Google（lh3.googleusercontent.com。画像最適化を通さない）
   │
   └─ ログイン ──→ Supabase Auth（本番の Auth `natueveOAuth`。Google OAuth → /auth/callback）

[GitHub Actions（ci.yml）] main への push
   └─ quality
        └─ deploy-staging（自動） ──→ `natueve-web-frontend-stg`（natueve-web-stg.natuportal.org）
             └─ deploy-production（承認後） ──→ `natueve-web-frontend`（natueve-web.natuportal.org）
```

- 静的ファイルへのリクエストは Worker を動かさずに返され、課金されない。
- 検証環境も同じ構成で、接続先だけが変わる（API は `natueve-api-stg.natuportal.org`、Auth は開発の Auth 用プロジェクト、画像は `assets-dev.natuportal.org`）。
  workers.dev と Version URL は本番・検証とも無効（後述の「割り当て方法」）。
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
  静的ファイル全体（`/*`）にはセキュリティヘッダーも付ける（下の「セキュリティヘッダー」）。

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
  ダッシュボードの「Worker URL」で、プロダクション（`workers_dev`）とプレビュー（`preview_urls`）のトグルがともに OFF であることを、検証環境と本番で確認した（2026-10-27。本番は #329 の返信の画像）。
  Custom Domain 経由の Previews（`previews_enabled`）の値は未確認。ダッシュボードの Domains タブの「+ Add Domain」では「Enable for」で Preview を許可するかを選ぶ（[公式](https://developers.cloudflare.com/workers/previews/custom-domains/)）ため、割り当て時にどう設定されたかも分からない。API（`GET /accounts/{account_id}/workers/domains`）での値の確認と、Custom Domain 経由の Previews が配信されていないことの確認は、未決事項 1 に残す。

### 割り当てる時期

割り当てた時点で、このドメインに誰でもアクセスできるようになる。
そのため、次がすべてそろってから管理者が割り当てる（#328。2026-10-27 に割り当て済み）。
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

2026-10-27 に割り当てて、上の 4 つを確かめた（#329）。

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

### HTTPS へのリダイレクト

HTTP でのアクセスは、Cloudflare のエッジが HTTPS へ 301 でリダイレクトする（#382）。アプリ（Worker・`next.config.ts`）ではリダイレクトしない。

- リダイレクトの応答は Cloudflare が返している（`Server: cloudflare`。リポジトリにはリダイレクトの処理も設定もない）。
  設定元はゾーン（`natuportal.org`）の「Always Use HTTPS」（SSL/TLS → Edge Certificates）。管理者がダッシュボードで確かめた（2026-11-13）。
  ゾーン全体に効くため、サブドメインを足しても個別の設定は要らない。
- パスとクエリ（エンコードを含む）はそのまま引き継がれる。
- 2026-11-13 に、次のホストすべてで `http://` が `https://` への 301 になることを確かめた。
  `natueve-web`・`natueve-web-stg`・`natueve-api`・`natueve-api-stg`・`assets`・`assets-dev`（いずれも `.natuportal.org`）。
- 同じ日に、本番と検証環境の `http://…/event-list?page=1` を Safari・Chrome・Firefox・Edge（macOS）で開き、
  証明書の警告と混在コンテンツの警告が出ず、`https://…/event-list?page=1` で表示されることを確かめた。
  ブラウザには自分で HTTPS に切り替える機能（Chrome・Firefox の HTTPS-First など）があるため、ブラウザでの確認はサーバー側のリダイレクトの確認を兼ねない（リダイレクトは curl で確かめる）。
- 証明書は Cloudflare が用意したもの（発行元は Google Trust Services。2026-11-13 時点の有効期限は 2027-01-25）。
- 2026-11-13 の時点では HSTS（`Strict-Transport-Security`）が付いていなかった（本番と検証環境の応答ヘッダーを curl で確かめた）。
  #386 でアプリから付けるようにした（下の「セキュリティヘッダー」の「HSTS」）。
  リダイレクトは HSTS を付けた後も残す。ブラウザが HSTS を覚えるのは HTTPS の応答からで、初めて HTTP で来た利用者はこのリダイレクトで HTTPS に移る。

確認するコマンド（`301` と、クエリを含む `https://` の `Location` が返ればよい）:

```bash
curl -sS -o /dev/null -D - "http://natueve-web.natuportal.org/event-list?page=1" | grep -i -E "^HTTP|^location"
```

## 環境変数

接続先の変数（`NEXT_PUBLIC_API_BASE_URL`・`NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_ANON_KEY`）とデプロイ用のトークンは、
GitHub Actions の Environment に置く（ADR-0003）。検証用は `staging`、本番用は `production` の Variables/Secrets に、同じ変数名で置く。
デプロイに使う値はリポジトリの Variables/Secrets には置かない（`ci.yml` は、品質チェックのビルドも含めてリポジトリの Variables を参照しない。#330）。
ビルド時のフラグ（`NEXT_PUBLIC_USE_MSW`・`USE_DEV_ASSETS`・`SITE_NOINDEX`）は Environment に置かず、ワークフローの `env:` に固定する。
`NEXT_PUBLIC_*`・`USE_DEV_ASSETS`・`SITE_NOINDEX` はビルド時に反映されるため、本番と検証で値が違う場合はそれぞれの値でビルドし直す（使い回さない。ADR-0003）。
`CSP_REPORT_ONLY` は Worker の実行時に読む変数のため、ビルド時の `env:` とは別に、`wrangler.jsonc` の `vars` で渡す（下の「Worker の実行時変数」）。

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
`USE_DEV_ASSETS` はビルド時には `next.config.ts`（`images.remotePatterns`）だけが参照する（クライアントの JS にも埋め込まれない）。
実行時には `src/lib/csp.ts` も参照する（CSP の `img-src`・`connect-src` に開発用の取得元を足す。下の「Worker の実行時変数」）。
本番の値は `production` の Environment に設定済み（2026-10-27。#329）で、本番のデプロイのジョブ（`deploy-production`。#362）で使う。
#329 の受け入れ基準は ADR-0003 に合わせて更新済みである（`BUN_VERSION` は使わず。下記「ビルドに使うツールの版」）。
`NEXT_PUBLIC_USE_MSW`・`USE_DEV_ASSETS`・`SITE_NOINDEX` はワークフローの `env:` に固定する（下の表）。

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
| `USE_DEV_ASSETS` | 未設定（または `false`） | `true` | `true` のとき、ビルド時には `next.config.ts` の `remotePatterns` にローカル開発・検証環境用の R2 の公開ドメイン `assets-dev.natuportal.org`（NatuEve_API ADR-0039）を、本番と同じ `pathname`・`search`・`port` の制限付きで加え（#353・#351）、実行時には `src/lib/csp.ts` が CSP の `img-src`・`connect-src` に同じオリジンを足す（下の「Worker の実行時変数」）。未設定・`false` では許可しない。ジョブごとにワークフローの `env:` に固定する（検証ジョブは `true`、本番ジョブは `"false"` と明示。#330）。本番のビルドで立てると、本番の画像最適化が開発用バケットの画像も変換するようになる |
| `SITE_NOINDEX` | `false` | `true` | `true` のときだけ、`next.config.ts` の `headers()` で全ページに `X-Robots-Tag: noindex` を付ける（#372。付かないパスは「robots.txt / noindex」）。未設定・`false` では付けない。本番を検索から消さないよう、本番ジョブでも `"false"` と明示する |

- `NEXT_PUBLIC_USE_MSW`・`USE_DEV_ASSETS`・`SITE_NOINDEX` のビルド時の反映（`next.config.ts` への許可リスト・ヘッダー）は、値を変えると再ビルドが必要。
- ローカル開発は従来どおり `.env.local` を使う。Workers のランタイムで確認する場合は `.dev.vars`（`NEXTJS_ENV=development`）を使う。
  どちらもコミットしない。
  - ローカル開発・`bun run preview` では、`.env.local` に `USE_DEV_ASSETS=true` を設定する（`.env.example` の既定）。
    ビルド時の `remotePatterns`（`next.config.ts`）にはこれが効く。
  - `.dev.vars` は Worker の実行時変数なので、実行時に読む `CSP_REPORT_ONLY`・`USE_DEV_ASSETS`（CSP 側。下の「Worker の実行時変数」）には効く。
    ビルド時にしか読まない `next.config.ts` の `remotePatterns` には効かない。
- 検証環境で `assets-dev.natuportal.org` を表示するには、ビルド時の `USE_DEV_ASSETS=true`（ワークフローの `env:`）と
  実行時の `USE_DEV_ASSETS=true`（`wrangler.jsonc` の `env.staging` の `vars`）の両方が要る。片方だけだと、
  画像最適化の許可リストか CSP のどちらかに開発用の取得元が入らず、画像が止まる。そのビルドを本番にも出すと
  本番の許可リストに `assets-dev.natuportal.org` が入るため、環境ごとにビルドする。検証環境での表示確認は、環境ができてから行う（NatuEve_API#219）。

### Worker の実行時変数（wrangler.jsonc の vars）

Worker の実行時に読む。`src/proxy.ts` → `src/lib/csp.ts` が参照する。`wrangler.jsonc` の `vars` で渡し、
OpenNext の `populateProcessEnv` が Worker の文字列のバインディングを `process.env` に供給する。
**CI のワークフローの `env:` の値は実行時には届かない**（OpenNext が `.open-next/cloudflare/next-env.mjs` に焼くのは
`.env` 系ファイルの値だけで、CI は `.env` を使っていない。`bun run preview` は手元の `.env` 系ファイルの値を入れるため、
この問題はローカルでは再現しない）。`vars` は `env.staging` に引き継がれないため、検証環境は宣言し直す。

| 変数 | 本番の値 | 検証環境の値 | 備考 |
|---|---|---|---|
| `CSP_REPORT_ONLY` | `false` | `false` | `true` のとき、proxy が nonce の CSP を `Content-Security-Policy-Report-Only` で付ける（違反を止めない）。それ以外では `Content-Security-Policy`（enforce）。#412 で本番・検証とも `"false"` にした（それまでは `true`）。未設定でも enforce になるが、`vars` にない変数はビルド時に読んだ `.env` 系ファイルの値で埋まる（OpenNext の `populateProcessEnv` は `vars` を先に入れ、`.env` の値は未設定のものだけに `??=` で入れる）ため、コミットされうる `.env.production` に左右されないよう明示する。障害のときに `true` に戻す手順と注意は下の「CSP」の「戻し方」 |
| `USE_DEV_ASSETS` | `false` | `true` | `true` のとき、`src/lib/csp.ts` が CSP の `img-src`・`connect-src` に `assets-dev.natuportal.org` を足す。検証環境は `assets-dev` の画像を表示するため立てる（#353）。本番は立てず、`"false"` と明示する（#412。理由は `CSP_REPORT_ONLY` と同じで、`vars` にないと `.env.production` の値で埋まるため） |

- 値を変えると、次のデプロイで反映される（ビルドのし直しは不要。`vars` はデプロイ時に Worker に付けられる）。
- ローカルの `bun run preview`（`wrangler dev`）では、`.dev.vars` で上書きできる（`.dev.vars` はビルド時の `next.config.ts` には効かない）。

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
  - **ダッシュボードで作った Worker に Custom Domain を割り当てた後のデプロイ**: 2026-10-27 に検証環境で確かめた（本番も同じ組み合わせになる。本番の Custom Domain も同日に #328 で割り当て済み。本番の割り当てはデプロイの後に行ったため、割り当て後の CI のデプロイは次の本番のデプロイで同じく確かめる）。
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
  （読まないのは test のときだけ）、`NEXT_PUBLIC_*`・`USE_DEV_ASSETS`・`SITE_NOINDEX` はビルド時に反映されるため、
  ローカルの値（例: `NEXT_PUBLIC_USE_MSW=true`、`USE_DEV_ASSETS=true`、ローカル API のオリジン）が本番ビルドに混入する。
  やむを得ずローカルから実行する場合は、本番の値を環境変数として明示的に渡す（`process.env` は `.env.local` より優先される）。
  その際、**`.env.local` にあるビルド時に効く値（`NEXT_PUBLIC_*`・`USE_DEV_ASSETS`・`SITE_NOINDEX`）はすべて上書きする**（渡さなかった変数には `.env.local` の値が使われる。
  特に `NEXT_PUBLIC_USE_MSW=false` と `USE_DEV_ASSETS=false` を渡し忘れると、モック認証や開発用画像の許可が本番で有効になるため注意。`.env.local` に `SITE_NOINDEX=true` があるときに `SITE_NOINDEX=false` を渡し忘れると、本番が検索から消える）。
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
| `deploy-production` | `deploy-staging` の後、承認を経て | `production`（承認が要る） | 接続先の確認 → `opennextjs-cloudflare build`（本番の値。`USE_DEV_ASSETS`・`SITE_NOINDEX` は立てない）→ main の最新かの確認 → `opennextjs-cloudflare deploy`（#362） |

`quality` の表示名（`Lint / Format / Typecheck / Test / Build`）はシェルスクリプトの検査を含めていない。表示名は必須チェックの設定に紐づく可能性があるため、変更は必須チェックへの影響を確認してからにする（#362 のレビュー）。

- 起動は `pull_request` と main への `push` だけ。`workflow_run`・`pull_request_target` は使わない（ADR-0003 決定 3。起動元とデプロイするコミットがずれるため）。
  デプロイは main への push で起動した実行の中で動かす（同）ため、手動でデプロイするための `workflow_dispatch` も設けない（出し直しは下のとおり再実行で行う）。
  デプロイを含む main への push には paths フィルタを付けず、`[skip ci]` も使わない。
  出し直すときは、main の最新のコミットの実行を再実行する（古いコミットの実行は、下の「main の最新の確認」で止まる）。
- **同時実行**: ワークフロー単位の `concurrency` は、PR だけ古い実行を取り消す。main への push の実行は `github.run_id` で実行ごとに別のグループにし、取り消さない。
  デプロイのジョブはジョブ単位のグループ（`deploy-staging`・`deploy-production`）に入れ、`cancel-in-progress: false` にする（同じ環境へのデプロイは同時に 1 つだけ。途中で中断しない）。
  検証は `queue: max`（待機中のジョブを取り消さない。最大 100 件まで待機できる）、本番は既定の `queue: single` にする。
  本番は新しい実行のジョブが来ると、承認待ち・待機中の古いジョブが `Canceling since a higher priority waiting request for deploy-production exists` で取り消される（ADR-0006）。
  承認するのは、いちばん新しい実行の 1 件だけでよい。
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
- `SITE_NOINDEX` も `"false"` と明示して立てない（立てると本番が検索から消える。#372）。
- 最上位の設定を使うため、ジョブの `env:` に `CLOUDFLARE_ENV: ""` を置く（ジョブの `env:` は全ステップに継承され、空文字が設定される場合には、ビルドとデプロイの両方のステップで効く。`CLOUDFLARE_ENV` を参照しない他のステップには、空文字の変数が設定されるだけで影響はない）。
  `wrangler.jsonc` に `env` があるため、環境を指定しないと wrangler が警告を出す。`--env=""` は OpenNext 1.20.13 が空文字を捨てて wrangler に渡さないため効かない
  （`getWranglerArgs` の `args.env ? [...] : []`）。wrangler は `CLOUDFLARE_ENV` が環境変数にあれば空文字でも指定ありとみなし（`variableName in process.env`）、
  OpenNext は自分の環境変数をそのまま wrangler に渡す。手元で、空の `CLOUDFLARE_ENV` で本番用の `opennextjs-cloudflare build` が通り、
  `wrangler deploy --dry-run` で警告が出ず、`WORKER_SELF_REFERENCE` が `natueve-web-frontend` を指すことを確かめた（wrangler 4.150.0）。
  GitHub Actions が空文字の環境変数を設定するかも含めて、最初の実行（2026-10-27。#363 のマージ後の実行。コミット `e9caa6a`）で確かめた。ビルドとデプロイのログに環境を指定していないという警告は出ず、空文字が効いていた（`.env.production` に `CLOUDFLARE_ENV` を書くと、OpenNext がその値を読んで別の環境を選びかねないため、書かないこと）。
- 最初の実行で、必須承認者の承認の後に、本番の Worker `natueve-web-frontend` へのデプロイが成功することを確かめた（2026-10-27 の実行。`Uploaded natueve-web-frontend` の後、`No targets deployed` で routes には触れない。Custom Domain 未割り当てで `workers_dev`・`preview_urls` 無効のため、公開は変わらない）。
- 本番ビルドで MSW が動いていないことを実機で確かめた（2026-10-27。`NEXT_PUBLIC_USE_MSW` は `"false"` に固定していて、コード上も `MSWProvider` が development 以外では即 return するため起動しない。DevTools の Service workers に本番オリジンの登録がなく、`mockServiceWorker.js` への実行時リクエストもなく、実データが表示される。#329）。
- 本番へ出しても、Custom Domain を割り当てるまでは公開されない（`workers_dev`・`preview_urls` は無効）。割り当ては「割り当てる時期」の条件がそろってから行う。2026-10-27 に #328 で `natueve-web.natuportal.org` を割り当て済みで、本番のドメインは公開済み。割り当て後の 4 点確認（上の「割り当てる時期」）も済んだ。

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
   #363 のマージ後の最初の実行（2026-10-27。`e9caa6a` の実行）では、`deploy-production` が承認待ちになり、必須承認者の承認の後に本番へのデプロイが成功することを確かめた。
   - #362 の後は、承認すると本番へデプロイされる。古い実行の承認待ちは、新しい実行が来ると自動で取り消される（ADR-0006）。
     ADR-0006 の前（`queue: max`）に溜まった古い実行は、2026-11-18 に最新の 1 件を残して `gh run cancel` で取り消した（承認しても main の最新の確認で止まるため）。
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
    API が配信ドメイン（`R2_PUBLIC_BASE_URL`）やキーの形式を変えるときは、`src/lib/imageOrigins.ts`（`next.config.ts` と `src/lib/csp.ts` の共通の一覧。下の注を参照）の
    `hostname`・`pathname` も合わせて変える。
  - Google のプロフィール画像（`lh3.googleusercontent.com`）は許可しない（#351）。アバターは `next/image` の `unoptimized` で表示し、
    画像最適化を通さない（`GlobalUserAvatar`・`ProfileHeader`・`EventCard`）。Google のアバターの URL は末尾（例: `=s96-c`）でサイズを
    変えられ、ほかの人のアバターも含めて有効な画像の URL をいくらでも作れるため、`pathname` では変換の数を抑えられない。
    `unoptimized` を外してアバターを最適化に通す場合は、この点を踏まえて改めて検討する。
  - ローカル開発・検証環境用の R2 の公開ドメイン `assets-dev.natuportal.org`（NatuEve_API ADR-0039）は `USE_DEV_ASSETS=true` のビルドでのみ許可する（#353。上の「環境変数」。実行時の CSP への反映は `wrangler.jsonc` の `vars`。上の「Worker の実行時変数」）。
  - picsum.photos・i.pravatar.cc は `NEXT_PUBLIC_USE_MSW=true` のビルドでのみ許可する（`pathname` は絞らない。このビルドは公開しない）。
  - placehold.co・example.com は削除済み。
  本番ビルド（`USE_DEV_ASSETS`・`NEXT_PUBLIC_USE_MSW` がどちらも `true` 以外。未設定・`false` を含む）には
  開発用・モック用の取得元が入らない（ADR-0003 決定 4。`src/__tests__/nextConfigImageHosts.test.ts` で設定値を検証）。
  取得元の一覧は `src/lib/imageOrigins.ts` に置き、`next.config.ts`（`remotePatterns`。ビルド時）と
  `src/lib/csp.ts`（CSP の `img-src`・`connect-src`。実行時）の両方から参照する。
  2 か所に一覧を別々に置くと、片方だけ変えたときに画像が止まるためである（ADR-0005 決定 1）。
  `next.config.ts` は読み込み時に `initOpenNextCloudflareForDev()` を呼ぶため、proxy（Worker のバンドル）からは import しない。
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

## イベント詳細の SSR / メタデータ

- `event/[id]/page.tsx` は Server Component で、`generateMetadata` とページ本体が同じ API 結果を使う（React `cache`）。
- `generateMetadata` は SSR 時に `GET /api/v1/events/{id}` を呼び、イベント名を `title`、説明文の冒頭を `description` に出力する。
- API が 404 を返した場合は `notFound()` で HTTP 404 を返す。
- サーバー側の API 取得は `NEXT_PUBLIC_API_BASE_URL` を使う。送信元は Cloudflare の IP に見えるため、API 側の許可設定を確認する。
- `global_fetch_strictly_public` により同一ゾーンの API へは公開経路で fetch する。検証環境でサーバー側から取得できることを確認する。
- ISR は使わない（#413 で全ページを動的レンダリングにしたため、`revalidate`・`generateStaticParams` は設定しない）。イベント詳細 API は `unstable_cache`（`revalidate: 60`）で包み、`generateMetadata` とページ本体で共有する。ただし OpenNext の incremental cache は現状 dummy のため、`unstable_cache` は実際にはキャッシュせず、API の取得も HTML の描画も毎リクエストになる（本番の応答も `x-nextjs-cache: MISS`）。Cloudflare 上での実キャッシュの導入は別途検討する。
- 参加人数など変わりやすい値はクライアント側でも再取得する。
- OGP はイベント名・説明文の冒頭・先頭の画像を出力する（#380）。画像がなければ既定の OGP 画像を使う。認証なしで呼べる API が返す項目だけを使う。
- 存在しないイベント ID ではイベント名・説明文・画像を出さず、サイト共通の説明文と既定の OGP 画像のまま 404 を返す。canonical と `og:url` は layout の値のまま（404 は検索に載らないため問題ない）。

## sitemap.xml

- `src/app/sitemap.ts` は `dynamic = "force-dynamic"` で、リクエストごとに `GET /api/v1/sitemap/events` を呼ぶ。
- `revalidate` は使わない。使うとビルド時にプリレンダリングされ、`NEXT_PUBLIC_API_BASE_URL` が空の PR の CI では `resolveUrl` が例外を投げてビルドが失敗する。OpenNext は現状 dummy incremental cache のためキャッシュも効かない。
- API が失敗（429 / 5xx 等）した場合は例外を投げて `/sitemap.xml` を 500 にする。静的ページだけの部分的な sitemap は返さない。
- API にはレート制限があり（同一 IP 平均 1 回/分・バースト 5 回、NatuEve_API ADR-0043）、短時間に連続して取得すると 500 になりうる。
- 1 ファイルの上限は 50,000 URL。静的ページとの合計がこれを超えないよう、API が返す更新日時の降順の先頭から残し、古いイベントを切り詰める。超えるようになったら `generateSitemaps` で分割する。API も応答の上限が 50,000 件でページングがないため、分割には API 側の変更も要る。

## robots.txt / noindex

- `src/app/robots.ts` は全環境で同じ内容（全体を許可し、本番の `sitemap.xml` を記載）。
- 検索に載せないページは `Disallow` にせず、`noindex` で制御する。`Disallow` するとクロールされず、`noindex` が読まれなくなる。
- ログインが要るページなどは、各 `layout.tsx` の `metadata` に `robots: { index: false }` を設定する（`/mypage`、`/event-post`、`/report-post`、`/signin`、`/auth/callback`、`/coming-soon`、`/users/[id]`）。
- `/users/[id]` は個人のページのため検索に載せない。主催者名はイベント詳細ページの本文に出るため、そちらが検索対象になる。
- 検証環境は `SITE_NOINDEX=true` でビルドし、全ページ（404・`robots.txt`・`sitemap.xml` を含む）に `X-Robots-Tag: noindex` を付ける。metadata ではなくヘッダーにするのは、ページごとの `metadata` の設定に左右されないため。
- Workers では、静的アセット（`/images/*`・`/_next/static/*` など）と `/_next/image` は `headers()` を通らないため付かない。ページは `noindex` なので許容する（確認: `wrangler dev`。#372）。

## セキュリティヘッダー

本番・検証環境の応答に次のヘッダーを付ける（#335。HSTS は #386。CSP は #412 で proxy の nonce の CSP に切り替えた）。

| ヘッダー | 値 | 付ける場所 |
|---|---|---|
| `Content-Security-Policy` | 下の「CSP」 | ページ（`src/proxy.ts`）。proxy を通るリクエストだけ（下の「CSP が付かないパス」） |
| `Content-Security-Policy-Report-Only` | `require-trusted-types-for 'script'; trusted-types nextjs` | ページ（`src/proxy.ts`）。Trusted Types を観察するため（下の「Trusted Types」）。開発時は付けない |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`（段階 2。下の「HSTS」） | ページ（本番ビルドのときだけ）と静的ファイル |
| `X-Frame-Options` | `DENY` | ページと静的ファイル（`public/_headers`） |
| `X-Content-Type-Options` | `nosniff` | ページと静的ファイル |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ページと静的ファイル |

- CSP 以外の 4 つは `next.config.ts` の `headers()` と `public/_headers` で付け、値を揃える（`commonSecurityHeaders`・`strictTransportSecurityHeader`。テストで一致を確かめる）。
- `/_next/image` には付かない（`headers()` も `_headers` も proxy も通らない）。応答には Next.js が画像用に付ける `Content-Security-Policy: script-src 'none'; frame-src 'none'; sandbox;` だけが付く。
  画像は枠に埋め込まれても操作を乗っ取られる画面がなく、`Content-Type` も画像の型で返るため、許容する。
- `X-Frame-Options` は、CSP の `frame-ancestors` を解さない古いブラウザ向けに併せて付ける。
- `Permissions-Policy` は付けていない。カメラ・マイク・位置情報を使う機能を足すときに、使う機能だけを `(self)` で許可する形で決める。

### CSP

nonce と `'strict-dynamic'` の CSP を、`src/proxy.ts` がリクエストごとに nonce を作って付ける（#413・#412。決定は [ADR-0005](./adr/0005-csp-nonce-dynamic-rendering.md)）。
中身は `src/lib/csp.ts` の `buildCspHeader` で組み立てる。本番・検証環境とも enforce（`Content-Security-Policy`）で、
`CSP_REPORT_ONLY` を `"false"` にしている（上の「Worker の実行時変数」）。

| 項目 | 値 | 理由 |
|---|---|---|
| `default-src` | `'self'` | 下に書かない種類（`frame-src` など）は自サイトだけ |
| `script-src` | `'self' 'nonce-{nonce}' 'strict-dynamic'` | nonce の付いたスクリプトと、それが読み込んだスクリプトだけを動かす。`'self'` は `'strict-dynamic'` を解さない古いブラウザ向けで、対応するブラウザでは無視される。`'unsafe-inline'`・`'unsafe-eval'` は含めない |
| `style-src` | `'self' 'unsafe-inline'` | `next/image` の `style` 属性・sonner が差し込む `<style>` など、インラインのスタイルがある |
| `img-src` | `'self' data: blob:` と画像の取得元 | `blob:` はアップロード前のプレビュー。取得元は R2 の公開ドメイン（`USE_DEV_ASSETS=true` で `assets-dev` が増える）・アバターの `lh3.googleusercontent.com`・MSW のモック（`NEXT_PUBLIC_USE_MSW=true` のとき）。`remotePatterns` と同じ `src/lib/imageOrigins.ts` から作り、テストで一致を確かめる |
| `font-src` | `'self'` | `next/font/google` はビルド時にフォントを取り込み、自サイトから配る |
| `connect-src` | `'self'`・R2 の公開ドメイン・`https://*.r2.cloudflarestorage.com`・API・Supabase Auth | API と Supabase は `NEXT_PUBLIC_API_BASE_URL`・`NEXT_PUBLIC_SUPABASE_URL` のオリジン。R2 は presign の署名付き URL への PUT（NatuEve_API の `internal/storage/r2.go`） |
| `object-src` | `'none'` | `<object>`・`<embed>` を使わない |
| `base-uri` | `'self'` | `<base>` の差し込みで相対 URL の行き先を変えられないようにする |
| `form-action` | `'self'` | フォームを他サイトへ送らせない（OAuth は画面遷移で、フォーム送信ではない） |
| `frame-ancestors` | `'none'` | 他サイトの枠に埋め込ませない（クリックジャッキング対策） |
| `upgrade-insecure-requests` | ― | `http://` の読み込みを `https://` に上げる。Report-Only では無視されるため、`CSP_REPORT_ONLY=true` のときは付けない |

- 開発時（`next dev`）も付ける。`'unsafe-eval'`（React の開発版）・HMR 用の `ws:`・`wss:`・MSW 用の `worker-src 'self'` だけを足す（ADR-0005 決定 4）。
- 接続先は実行時の `process.env` から組み立てる。`NEXT_PUBLIC_*` はビルド時に埋め込まれた値が使われる。値が空・URL でなければ許可に加えない（proxy を落とさないため。
  その接続先は CSP で止まり、Console に出る）。
  #412 より前は `next.config.ts` の CSP が URL でない値でビルドを止めていたが、その検査はなくなった。代わりに、本番・検証環境とも
  デプロイのジョブの「Check connection variables」で、接続先が期待値と完全に一致するかを確かめる（下の「CI/CD」）。
- **接続先・画像の取得元・埋め込みを足すとき（新しい外部 API、アクセス解析、YouTube や地図の埋め込み、Google 以外のログイン方法のアバターなど）は、`src/lib/csp.ts` にも足す。**
  足さないとブラウザが止め、通信の失敗・画像が出ない・埋め込みが空になるといった症状になる（#412 から enforce のため、本番でも止まる）。
  埋め込み（`<iframe>`）は `frame-src` を足す（今は `default-src 'self'` に従い、他サイトの枠は止まる）。リンクで移るだけなら CSP は関係ない。
- R2 の S3 API のホストはワイルドカードにしている。ほかのアカウントの R2 にも一致し、スクリプトが動けば持ち出し先になりうるが、#412 で絞らないと決めた（ADR-0005 の「トレードオフ・制約」）。
  nonce の CSP で差し込まれたスクリプトはそもそも動かず、動いた場合もページの移動など CSP で止められない持ち出し方が残るため、
  アカウント ID を実行時に渡して揃え続ける手間と、ずれたときにアップロードが壊れる危険に見合わない。
- 違反の報告先（`report-uri`・`report-to`）は指定していない。違反は利用者のブラウザのコンソールに出るだけで、こちらには届かない。
- `_global-error` はビルド時に作られるため nonce が付かず、enforce の下ではその画面のスクリプトが止まる（root layout で例外が出たときだけ使う画面。#418。
  仕組みからの判断で、その画面を出して試してはいない）。

CSP を proxy だけで付ける理由:

- Workers では、OpenNext が `next.config.ts` の `headers()` と proxy の応答ヘッダーを、Next.js に渡すリクエストのヘッダーにも写す（`@opennextjs/aws` 4.1.12 の `core/requestHandler.js`）。
  Next.js は nonce を `Content-Security-Policy` から、なければ `-Report-Only` から読む（next 16.4.6 の `get-script-nonce-from-header.js`。16.4.2 では `parse-request-headers.js`）。
  そのため、nonce のない CSP をほかの場所で付けると、Next.js がそれを読んで `<script>` に nonce を付けない（#416 で検証環境と `bun run preview` で確かめた。Report-Only での確認）。
  enforce では、その結果として nonce のないスクリプトがすべて止まる（仕組みからの判断で、enforce の下では試していない）。
- #412 で `next.config.ts` の #335 の CSP（`script-src 'self' 'unsafe-inline'`）と、検証環境でそれを外すビルド時のフラグ `DISABLE_NEXT_CONFIG_CSP` を消した。
  `next.config.ts` の `headers()` に CSP を足さない（テストで確かめる）。

CSP が付かないパス（ADR-0005 決定 3）:

- proxy の matcher で外しているパス（`/api`・`/_next/static`・`/_next/image`・`favicon.ico`・`robots.txt`・`sitemap.xml`・`mockServiceWorker.js`）と、
  先読みのリクエスト（`next-router-prefetch`・`purpose: prefetch` のヘッダー付き）には付かない。HTML ではないため受け入れる。
- 静的ファイル（`public/` の画像など）は Workers の assets レイヤが返し、proxy を通らないため付かない。
- `/icon.png`・`/apple-icon.png`（`src/app` のメタデータルート）は matcher で外していないため付く（害はない）。

戻し方:

- **一時的に Report-Only に戻す**: `wrangler.jsonc` の `CSP_REPORT_ONLY` を `"true"` にしてデプロイする（本番は最上位、検証環境は `env.staging`。ビルドのし直しは要らない）。
  ほかに CSP がないため、戻している間は有効な CSP が 1 つもなくなる（差し込まれたスクリプトも止まらない。クリックジャッキングは `X-Frame-Options` で防ぐ）。
  原因を直したら `"false"` に戻す。
- **#335 の CSP に戻す**: #412 の変更を revert する（`next.config.ts` の CSP と `DISABLE_NEXT_CONFIG_CSP` が戻る）。
  さらに #413（#418）以前に戻すときは、ADR-0005 の「トレードオフ・制約」の戻し方に従う。

### Trusted Types

#415 で入れた。決定は [ADR-0005](./adr/0005-csp-nonce-dynamic-rendering.md) の決定 6。

- Trusted Types は nonce の CSP に含めず、proxy が**別の `Content-Security-Policy-Report-Only` ヘッダー**として付ける
  （`src/lib/csp.ts` の `buildTrustedTypesCspHeader`・`src/proxy.ts`）。中身は `require-trusted-types-for 'script'; trusted-types nextjs`。
  dev（`next dev`）では付けない。React DevTools など開発ツールが DOM のシンクを使うため、違反で開発が止まらないようにする（#415 の AC）。
- **enforce の nonce の CSP には含めない**: Turbopack のランタイムが Trusted Types に対応しておらず（下の「既知の違反」）、
  含めると強制されてページ間の移動・先読みが止まるため（#415 のコメントでの議論。#412 の enforce 切替を上流の修正待ちで止めないため）。
  Report-Only のヘッダーで観察を続け、上流が直った後に enforce の CSP へ統合するかを改めて決める。
- `CSP_REPORT_ONLY=true` のとき（#412 より前と、上の「戻し方」で戻したとき）は nonce の CSP も同じヘッダー名で Report-Only になるため、proxy は `set` ではなく `append` で足す
  （`set` だと観察中の nonce の CSP を上書きで消してしまう）。最終の応答では、同じ名前のヘッダーは
  **カンマ区切りで 1 行に連結**されて届く（ローカルの preview で実測。下の「#415 の確認」）。カンマ区切りの CSP は
  複数のポリシーとして評価されるため、nonce の CSP も Trusted Types のポリシーもどちらも失われず、両方とも Report-Only で評価される。
  潰れる（last-wins になる）ことは確認できていないが、潰れた場合は RO モードのときに 1 つのヘッダー値へ連結するフォールバックを検討する。
- `trusted-types nextjs` は、作れる Trusted Types のポリシー名を、Next.js のランタイムが使う `nextjs`
  （`node_modules/next/dist/client/trusted-types.js`）に限定する。現状のビルド出力に `createPolicy` はなく許可は使われていないが、
  付けておいて害はない。ライブラリの内部でほかの名前のポリシーを作る違反が出たら、`src/lib/csp.ts` の許可リストに名前を足す。
  ポリシー名の照合は仕様上の**完全一致**（[Trusted Types 仕様](https://w3c.github.io/trusted-types/dist/spec/) § 4.2.5。`#` にコメントのような特別な意味はない）である。
- `src/` 内に Trusted Types のシンク（`innerHTML`・`document.write` など）はない（#415 の時点）。
- 既知の違反（Next.js の Turbopack ランタイム。上流の既知バグ
  [vercel/next.js#101261](https://github.com/vercel/next.js/issues/101261)）:
  1. ページ間の移動や先読みで読み込むチャンクを `document.createElement("script")` の `src` に文字列で代入する
     （`.open-next/assets/_next/static/chunks/turbopack-*.js`。ポリシーは作らない）。
  2. クライアントコンポーネントのチャンク参照が RSC ペイロードの `<script src async>` に入り、React がマウント時に
     `setAttribute("src", ...)` する（マウント時の代入は上流 issue の報告による）。
  1 はビルド出力（`.open-next/assets/_next/static/chunks/turbopack-*.js`）で、2 は検証環境の HTML（curl）の
  RSC ペイロードに `<script src async>` が入っていることで確認済み（2026-11-16。上流 issue にも報告あり）。
  Report-Only の間は違反が報告されるだけで止まらないため動くが、
  強制するとチャンクの読み込みが止まり、ページ間の移動・先読みが壊れる。**ポリシー名の許可リストでは解消できない**
  （ランタイム自身がポリシーを使わないため）。修正 PR は未確認（2026-11-16 時点。issue で着手の表明はある）。
  上流の issue は 2026-11-19 の時点でも Open で、Next.js 16.4.6 でも直っていない（#412 の手元の確認で、移動のたびに 1・2 の報告が出た）。
  webpack ビルドでは、ランタイムが `output.trustedTypes = 'nextjs#bundler'` でポリシーを作り、チャンクの URL をそのポリシーで通す
  （`node_modules/next/dist/build/webpack-config.js`。生成コードは `trustedTypes.createPolicy("nextjs#bundler", ...)`。
  `node_modules/next/dist/compiled/webpack/bundle5.js` で確認）。ただしポリシー名は完全一致のため
  **`trusted-types nextjs` では `nextjs#bundler` の作成が許可されない**。webpack への退避を検討するときは、
  許可リストに `nextjs#bundler` を足す必要がある。足し忘れると、enforce の下ではポリシーの作成が TypeError で失敗し、
  チャンクの読み込みが止まる（Next.js は `output.trustedTypes` を文字列で設定するため、webpack の
  `onPolicyCreationFailure` は既定の `stop` になる。`continue` を指定したときだけ `try`/`catch` で包まれ、
  Console に警告が出る。`node_modules/next/dist/compiled/webpack/bundle5.js` で確認）。

確認したこと（#412。2026-11-19。検証環境と同じ値でビルドした `opennextjs-cloudflare build --env staging` + `opennextjs-cloudflare preview --env staging`。ローカルの Workers ランタイム。Next.js 16.4.6）:

- wrangler の起動時の表示で `CSP_REPORT_ONLY` のバインディングが `"false"` になり、応答のヘッダー名も enforce（`content-security-policy`）になった。
- `/`（308）・`/about`・`/event-list`・`/signin`・`/contact`・`/guideline`・`/docs`・`/coming-soon`・404 の応答に、
  `content-security-policy` が 1 行だけ付き、`content-security-policy-report-only` には Trusted Types だけが載った（curl）。
  どのページも `<script>` のすべてに、応答の CSP と同じ nonce が付いた（例: `/about` 15 個・`/event-list` 18 個・`/contact` 16 個）。
- `/robots.txt`・`/sitemap.xml`・`/_next/static/chunks/*.js` には CSP が付かず、`/_next/image` には Next.js の画像用の CSP だけが付いた。`/icon.png` には付いた（上の「CSP が付かないパス」）。
- Orca の内蔵ブラウザ（Chromium）で上のページを開き、`ReportingObserver`（`buffered: true`）で集めた違反は 0 件だった。インラインのスクリプト（`self.__next_f`）も動いていた。
  - 止まることの確認: `onerror` 属性の付いた `<img>` を差し込むと、`script-src-attr` の違反（`disposition: enforce`）でハンドラが動かず、
    `https://example.com` への `fetch` も `connect-src` の違反（`enforce`）で止まった。
  - フッターのリンクで `/event-list` から `/contact` へ移ると、読み込み直さずに移り、Trusted Types の既知の違反（`report`）が 2 件出ただけだった。
  - `/contact` で送信するとトーストが表示され、元の画面へ戻った（違反なし）。
- ローカルからは検証環境の API への `fetch` が CORS で止まる（CSP ではない）ため、ログイン・データの表示・画像・アップロードは検証環境で確かめた（下の「確認したこと（#412。2026-11-19〜20…）」）。

確認したこと（#412。2026-11-19〜20。検証環境・本番。PR #458 の `46b0fd6`。詳細は #412 のコメント）:

- 検証環境・本番とも、`/event-list`・`/about`・`/signin`・`/contact`・`/guideline`・`/docs`・`/mypage`・`/event/[id]`・404 の応答は次のとおりだった（curl）。
  - `content-security-policy` は 1 行だけで、`'unsafe-inline'` はない。
  - `content-security-policy-report-only` には Trusted Types だけが載る。
  - `<script>` には、すべて応答と同じ nonce が付く（`/event-list` は 18 個中 18 個）。
  - 本番の CSP に `assets-dev` は入らず、検証環境には入る（`USE_DEV_ASSETS`）。
- Orca の内蔵ブラウザ（Chromium）で、違反を `ReportingObserver` で集めた。
  - ページの読み込み（未ログインのページ・イベント詳細・ユーザーページ）・一覧での操作・メニュー・画面内の移動・`/contact` の送信で、CSP の違反は 0 件だった（検証環境・本番）。
  - 画面内の移動で出るのは、Trusted Types の既知の違反（上の「既知の違反」）の `report` だけだった。
  - 検証環境では、ログイン（Google → `/auth/callback`）・マイページ・イベントの投稿の送信も確かめ、違反は 0 件だった。投稿では、presign 200 → R2 への PUT 200 → 作成 201 と進んだ。
  - 本番のログイン・マイページ・投稿は確かめていない。本番のアカウントを使い、本番にデータを作るためである。
    本番と検証環境の CSP は、接続先と画像の取得元（`assets-dev`）だけが違う（ADR-0005 決定 4）。
  - 差し込んだ `onerror` と、許可していない `fetch` は、検証環境・本番とも `enforce` で止まった。
- Firefox（検証環境）:
  - CSP の違反は出なかった。コンソールに出たのは、違反ではない情報の警告 2 件だけだった（`'strict-dynamic'` があるので `'self'` を無視した、報告先のない Report-Only）。
  - 表示・画面内の移動は正常で、差し込んだ `onerror` と外部への `fetch` は止まった。Firefox も Trusted Types の Report-Only を報告した。
- Safari（検証環境）:
  - CSP の違反は出ず、表示・画像・メニュー・画面内の移動は正常で、差し込んだ `onerror` と外部への `fetch` は止まった。
  - Safari は、報告先（`report-to`）のない Report-Only の Trusted Types を無視する（コンソールに注意が出る）。そのため、Trusted Types の観察は Chromium と Firefox で行う。
  - Web インスペクタでコードを実行するたびに、`decodeHTMLEntitiesPolicy` という名前の Trusted Types のポリシーの拒否（Report-Only）が出た。この名前はアプリのビルド結果にも依存パッケージにもなく、ページ側で `createPolicy` を包んでも呼ばれなかった。Web インスペクタ自身から出ていると考える（推定）。
- HTTP Observatory（本番。2026-11-20）: A+（110 点）、12 項目すべて合格だった。
  CSP の項目は `csp-implemented-with-unsafe-inline-in-style-src-only` で、減点は 0（`script-src` の `'unsafe-inline'` による減点はなくなった。#407）。

#412 より前の確認（記録。「上の CSP」は `next.config.ts` の #335 の CSP（#412 で削除）を指す）:

#416 の確認（2026-11-16。検証環境と同じ値でビルドした `bun run preview`。検証環境は curl だけ）:

- 上の CSP を外す前は、ページの応答に `content-security-policy`（上の CSP）と `content-security-policy-report-only`（proxy）が付き、
  `/about` の `<script>` 15 個のどれにも nonce が付かなかった。検証環境の `/event-list` も、`<script>` 18 個のどれにも付いていなかった（curl）。
- `DISABLE_NEXT_CONFIG_CSP=true` では `content-security-policy-report-only` だけが付き、`/`・`/about`・`/event-list`・`/signin` の `<script>` すべてに、応答と同じ nonce が付いた（curl）。
- Orca の内蔵ブラウザ（Chromium）で、`/about`・`/coming-soon`・`/docs`・`/guideline`・`/event-list`・`/signin`・`/event/[id]`・`/users/[id]`・`/mypage`・
  `/event-post`・`/report-post`（どちらも未ログインでは `/signin` へ移る）を開いた。メニュー・参加申し込みのボタン・検索・並び替えも操作し、Report-Only の違反は 0 件だった。
  読み込み中の違反も含めて、`ReportingObserver`（`buffered: true`）で集めた。検出できることは、許可していない `https://example.com` の画像を差し込み、報告されることで確かめた。
- クライアント側の移動で後から足される `/_next/static/chunks/*.js` には nonce が付かないが、`'strict-dynamic'` で許可され、違反にならなかった。
- ローカルからは検証環境の API への `fetch` が CORS で止まり（CSP ではない）、イベント一覧は 0 件だった。
  ログイン・データの表示・画像・アップロードは、検証環境で確かめる（結果は #416 に記録する）。

#335 で見送ったこと:

- **上の CSP を `Content-Security-Policy-Report-Only` で様子を見る**: 報告の受け取り先がないため、本番に出しても情報が集まらない。
  接続先をコードからすべて洗い出せたため、検証環境で確かめてから有効のまま本番に出す。

#335 の確認（2026-11-13。`bun run preview`。ローカルの Workers ランタイム）:

- ページ（`/`・`/event-list`・`/about`・`/signin`・`/robots.txt`・`/icon.png`・404・500）に 4 つすべてが付き、
  静的ファイル（`/_next/static/*`・`/images/*`）に CSP 以外の 3 つが付くことを curl で確かめた。
  `/_next/image` には 4 つとも付かず、上の Next.js の CSP だけが付くことも curl で確かめた。
- ヘッドレスの Chrome で `/event-list`・`/about`・`/signin`・`/guideline`・`/docs`・`/event-post`・`/mypage`・404 を開き、
  DevTools Protocol（`Audits.issueAdded`・`Log.entryAdded`）で CSP 違反がないことを確かめた。
  検出できることは、許可していない `https://example.com` への `fetch` が止まり報告されることで確かめた。
- ローカルでは API を起動しておらず、ログイン・データの表示・画像・アップロードは確かめていない。検証環境で確かめる。

#415 の確認（2026-11-16。Trusted Types。`bun run preview` 相当の `opennextjs-cloudflare build` + `wrangler dev`。ローカルの Workers ランタイム）:

- `/about` の応答に curl で、`Content-Security-Policy`（#335 の enforce）と
  `Content-Security-Policy-Report-Only` が付くことを確かめた。Report-Only のヘッダーは 1 行で、
  nonce の CSP と `require-trusted-types-for 'script'; trusted-types nextjs` がカンマ区切りで連結されて届く
  （同名ヘッダーの連結。ポリシーは両方とも評価される。上の「Trusted Types」節）。

確認するコマンド（4 つが返ればよい。`content-security-policy` は proxy の nonce の CSP の 1 行だけで、
`content-security-policy-report-only` には Trusted Types だけが載る）:

```bash
curl -sS -o /dev/null -D - "https://natueve-web.natuportal.org/event-list" | grep -i -E "^content-security-policy|^x-frame-options|^x-content-type-options|^referrer-policy"
```

検証環境で確かめる操作（開発者ツールのコンソールに、Trusted Types の既知の違反（上の「既知の違反」）のほかに `Content Security Policy` の違反が出ないこと）:
トップページ・イベント一覧・イベント詳細（画像・PDF の閲覧を含む）・ログイン（Google）・ヘッダーのアバター・マイページ・
イベントの投稿（画像・PDF のアップロード）・レポートの投稿（画像のアップロード）・プロフィールページ・お問い合わせ。

### HSTS

HTTPS の応答に `Strict-Transport-Security` を付け、ブラウザに「このホストは HTTPS でしか開かない」と覚えさせる（#386・#411）。
覚えたブラウザは、`http://` の URL を開くときもサーバーへ HTTP で問い合わせず、内部で `https://` に切り替える。
一度 HTTPS で開いたブラウザが、その後 `http://` で開くときの HTTP の問い合わせを中継されて、リダイレクトを握りつぶされたまま偽の画面へ誘導される（SSL ストリッピング）のを防ぐ。
初めての訪問（まだ覚えていないブラウザ）は防げない（RFC 6797 14.6。これを補うのが下の preload）。

値と範囲の決め方:

- **付ける場所はアプリ（`next.config.ts` と `public/_headers`）。** ゾーンの HSTS 設定（SSL/TLS → Edge Certificates → HSTS）は使わない。
  ゾーンの設定は `natuportal.org` 配下のほかのホスト名（API・assets・ほかのプロダクト）にも付き、変更も管理者の作業になるため。
  API・assets に付けるかは、それぞれの持ち主が決める（このリポジトリの範囲外）。
- **`includeSubDomains` を付ける。** 効くのはヘッダーを返したホストの下位（`*.natueve-web.natuportal.org`・`*.natueve-web-stg.natuportal.org`）だけで、
  兄弟の `natueve-api.natuportal.org` や親の `natuportal.org` には効かない（[RFC 6797](https://www.rfc-editor.org/rfc/rfc6797) 6.1.2・2.4.1.1）。
  このホストの下位にサブドメインはなく、付けても影響はこのサイトの中で収まる。
- **`preload` は付けない。** プリロードリスト（ブラウザに組み込まれる HSTS のリスト）は、登録するドメイン（`natuportal.org`）の apex で
  `includeSubDomains; preload` を返すことが登録の条件で（[hstspreload.org](https://hstspreload.org/)）、登録すると NatuPortal のすべてのサブドメインが HTTPS 必須になる。
  リストから外すにも数か月かかる。apex は名前解決できず（2026-11-16 時点）、決めるのはドメイン全体の管理者のため、このリポジトリでは扱わない。
  登録しないまま `preload` をヘッダーに付けても効果はない。
- **開発時（`next dev`）のページには付けない。** `localhost` を HTTPS で開いたときに、同じ `localhost` で動かすほかのサイトまで HTTPS に固定されないようにするため。
  `public/_headers` は Workers（`bun run preview` を含む）でだけ使い、`preview` は `http://localhost:8787` で開くため、ブラウザは HSTS を無視する（HTTP の応答の HSTS は無視される。RFC 6797 8.1）。
- `/_next/image` には付かない（上の表と同じ制約）。ブラウザはホスト単位で覚えるため、ページの応答に付いていれば足りる。
- HSTS を付けた後も、HTTP からのリダイレクト（上の「HTTPS へのリダイレクト」）は残す。

段階的な導入:

ブラウザに覚えられると、`max-age` が切れるまでこちらからは取り消せない。HTTPS で開けない問題が起きると、その間は利用者がこのホストを開けなくなる。
そのため、短い値で問題がないことを確かめてから延ばす。

| 段階 | 値 | 状態 |
|---|---|---|
| 1 | `max-age=300; includeSubDomains`（5 分） | #424 で導入。確認結果は下の「段階 1 の確認結果」 |
| 2 | `max-age=31536000; includeSubDomains`（1 年） | #411 の PR で上げた（今の値） |

- hstspreload.org は 5 分 → 1 週間 → 1 か月と刻み、各段階の `max-age` が切れるまで待って進めることを勧めている。
  このサイトはすでにすべて HTTPS で（上の「HTTPS へのリダイレクト」）、影響もこのホストの中で収まるため、#386 では 5 分から 1 年への 2 段階にした。
- 値を変えるときは `next.config.ts` の `strictTransportSecurityHeader` と `public/_headers` を両方変える（テストで一致を確かめる）。
  テストの期待値（`src/__tests__/securityHeaders.test.ts`）も同じ値に変える。
- 段階 1 で確かめること（検証環境、続いて本番）:
  - 応答に付いている（下のコマンド）。Workers の応答のヘッダーがエッジで消されないかは Cloudflare の文書で確かめられなかったため、実際の応答で確かめる。
  - Chrome で一度 `https://` のページを開いた後、`chrome://net-internals/#hsts` の「Query HSTS/PKP domain」でホスト名を照会すると、`dynamic_sts_domain` にホスト名が出る。
    続けて `http://` の URL を開くと、開発者ツールの Network に `307 Internal Redirect` が出て、その応答ヘッダーに `Non-Authoritative-Reason: HSTS` が付く。
    Chrome は HSTS がなくても自分で HTTPS に切り替える（HTTPS-Upgrades など）ため、307 が出るだけでは HSTS が効いた証拠にならない。理由のヘッダーまで見る。
    `max-age=300` の段階では、`https://` で開いてから 5 分以内に確かめる。
  - 割り当て後の確認と同じ 4 つ（トップページ・API の呼び出し・ログイン・画像の表示）。

戻し方:

- `max-age=0` を返すと、次に HTTPS で開いたブラウザは覚えた設定を消す。ヘッダーを外すだけでは、覚えた設定は `max-age` が切れるまで残る。
- `max-age=0` が効くのは、そのホストを HTTPS で開き直したブラウザだけである。段階 2（1 年）の後は、戻してもしばらく開かない利用者のブラウザには最長 1 年残る。
- 利用者のブラウザから個別に消すには、Chrome・Edge では `chrome://net-internals/#hsts`（Edge は `edge://net-internals/#hsts`）の「Delete domain security policies」を使う。

注意:

- 覚えられたホストで証明書のエラーが出ると、ブラウザは警告を飛ばして進む操作を出さない。証明書は Cloudflare が自動で更新する（上の「HTTPS へのリダイレクト」）。
  Custom Domain の付け替えや、証明書の設定を変えるときは、HTTPS で開けなくなる時間ができないようにする。

確認するコマンド（`strict-transport-security` の行が返ればよい）:

```bash
curl -sS -o /dev/null -D - "https://natueve-web.natuportal.org/event-list" | grep -i "^strict-transport-security"
```

確認したこと（2026-11-16。`bun run preview`。ローカルの Workers ランタイム）:

- ページ（`/` の 308・`/event-list`・`/about`・`/robots.txt`・`/icon.png`・404）と静的ファイル（`/_next/static/*`・`/images/*`）に
  `Strict-Transport-Security: max-age=300; includeSubDomains` が付き、`/_next/image` には付かないことを curl で確かめた。

段階 1 の確認結果（上の「段階 1 で確かめること」）:

2026-11-18 に確かめた（本番は `1d6d79d` のデプロイの後）。

| 確認 | 検証環境 | 本番 |
|---|---|---|
| 応答に付いている（curl。ページ・`/`・404） | 付いていた | 付いていた |
| HSTS で `http://` を開かずに `https://` へ切り替わる | 切り替わった | 切り替わった |
| トップページ・API の呼び出し・画像の表示（Orca の内蔵ブラウザ） | 正常 | 正常 |
| ログイン | 正常 | 正常 |

- HSTS の切り替えは curl の HSTS キャッシュ（`--hsts <file>`。curl 8.23.0）で確かめた。`https://` で開くとホスト名が `includeSubDomains` 付き（先頭に `.`）で記録され、
  続けて `http://` で開くとサーバーに HTTP で問い合わせずに `https://` の 200 になった。HSTS のない `natueve-api-stg.natuportal.org` は、同じ手順で HTTP のまま 301 が返った。
- ブラウザでは Brave（Chromium 157）で確かめた（2026-11-19）。
  - 検証環境: `http://` で開くと開発者ツールの Network に `307 Internal Redirect` が出て、応答ヘッダーに `Non-Authoritative-Reason: HSTS` が付いた。
  - 本番: `brave://net-internals/#hsts` で `dynamic_sts_domain` にホスト名が出て、`dynamic_upgrade_mode: FORCE_HTTPS`・`dynamic_sts_include_subdomains: true`、
    `dynamic_sts_expiry` と `dynamic_sts_observed` の差が 300 秒だった。Network には 307 の行が出なかった（理由は分かっていない）。
  - Orca の内蔵ブラウザは `chrome://net-internals` を開けず、Network の記録にもリダイレクトの応答が残らないため、この確認には使えない。
- 画面は、イベント一覧（API の `/api/v1/events`・`/api/v1/tags` が 200）と、イベント詳細のイベント画像（`assets.natuportal.org`・`assets-dev.natuportal.org` を `/_next/image` で表示）を確かめた。
- ログインは「Google でサインイン」から Google のログイン画面（`redirect_to` が各環境の `/auth/callback`、Auth が各環境の Supabase プロジェクト）へ進み、
  サインインの後にマイページが表示され、ログインが要る API（`/api/v1/me` が 200）が呼べることを確かめた。

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

1. **フロントのドメイン**: 一部解決済み（#328 で `natueve-web.natuportal.org` に決定し、2026-10-27 に管理者が本番 Worker に割り当てた。割り当て後の 4 点確認も済んだ。上の「独自ドメイン」「割り当てる時期」「割り当て方法」を参照）。
   残る確認: Custom Domain 経由の Previews（`previews_enabled`）が配信されていないこと。`wrangler.jsonc` の `routes` では設定していないが、ダッシュボードで割り当てたときにどう設定されたかは分からず、値も API（`GET /accounts/{account_id}/workers/domains`）で確認していない（上の「割り当て方法」）。
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
5. **CI/CD**: 一部解決済み（#330・#362）。main へのマージで検証環境へ自動でデプロイし、本番は承認を経てデプロイする（上の「CI/CD」）。
   - マージ前の初期設定（上の「CI/CD」の「初期設定」）。2026-10-27 に管理者が済ませた（検証用のトークンの権限の実機確認を含む）。
   - 承認を経て本番の Worker にデプロイできること。2026-10-27 の #363 のマージ後の実行（`e9caa6a`）で、必須承認者の承認の後に本番へのデプロイが成功することを確かめた。
   - 検証環境の Custom Domain `natueve-web-stg.natuportal.org` の割り当て。2026-10-27 に管理者が割り当て、割り当て後の CI のデプロイでもドメインが生きていることを確かめた（上の「検証環境」）。
   - 本番の Custom Domain 割り当て後の CI のデプロイ。割り当ては本番デプロイの後に行ったため、次の本番のデプロイで確かめる（上の「Cloudflare の API トークン」）。
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
