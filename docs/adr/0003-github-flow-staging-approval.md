# ADR-0003: GitHub Flow を続け、main へのマージで検証環境へ、承認後に本番へデプロイする

- ステータス: Accepted
- 日付: 2026-10-23
- 関連: #350, #330, #328, #329, #332, #334, #351, #353, ADR-0001, ADR-0002, NatuEve_API ADR-0036, NatuEve_API ADR-0039
- 構成の詳細・設定値・月額試算は [docs/Deployment.md](../Deployment.md) を参照

## コンテキストと課題

フロントエンドのブランチ運用は「作業ブランチ → main」の PR だけで、main への直接 push はブロックしている。
CI/CD の構築（#330）は着手済みで、#330 の受け入れ基準は「main へのマージで検証環境に自動デプロイ」に更新済みである。
本 ADR は、その前段の方針（ブランチ運用・検証環境の構成・本番へ出す操作）を決める記録である。
リリース後は、本番に出す前に、本番と同じ構成で結合しても問題ないかを確かめたい。

決める必要があったのは次の 3 点。

1. ブランチ運用（main の前に dev などのブランチを挟むか）。
2. 本番に出す前に確かめる場所と、本番へ出す操作。
3. 検証環境の接続先（API・Auth・画像取得元）の置き場所。

前提となる制約（2026-10 時点で公式ドキュメントを確認）：

- NatuEve_API は ADR-0036 で「GitHub Flow のまま、main へのマージで検証環境へ、承認後に同じイメージを本番へ」を決めた。
  フロントの検証環境の接続先は、API 側の検証環境（検証用 Cloud Run・検証用中継 Worker・検証用 Supabase プロジェクト）を指す。
- `NEXT_PUBLIC_*` は `next build` 時にクライアント用 JS へ埋め込まれる（ADR-0001 のトレードオフ）。
  API 側のように「1 回ビルドしたイメージをダイジェスト指定で検証・本番の両方に出す」ことはできない。
- リポジトリは public で、GitHub の Organization は Free プラン。
  GitHub Environments は Free プランの public リポジトリで使える（NatuEve_API ADR-0036 で確認済み）。
- API の `CORS_ALLOW_ORIGINS` はワイルドカード非対応（NatuEve_API ADR-0033）。
  そのため検証環境のフロントにも固定のオリジンが要る。Supabase Auth の Redirect URLs はワイルドカードの glob パターンも使えるが、
  検証用プロジェクトには検証オリジンの `/auth/callback` を登録する（`src/services/auth.ts` の `redirectTo` は `${window.location.origin}/auth/callback`）。
- Workers Paid（月 $5）はアカウント単位の課金で、含まれる量（月 1,000 万リクエスト・CPU 3,000 万ミリ秒）を共有する。
  Cloudflare Images の無料枠（月 5,000 ユニーク変換）の共有範囲は公式に明記がなく、検証環境経由でも本番の枠を消費しうる前提で扱う（ADR-0002・Deployment.md）。

## 決定

**ブランチは GitHub Flow（作業ブランチ → main）のまま増やさない。main へのマージで検証環境へ自動デプロイし、
本番へは承認を経て、同じコミットから本番用にビルドしたものを出す。**

1. **ブランチ**: main ← 作業ブランチ の PR だけで運用する。dev などの長期ブランチは作らない。
   本番の緊急修正も同じ経路（main → 検証環境 → 承認 → 本番）を通る。
2. **検証環境へのデプロイ**: main へのマージで自動で行う。
   同じコミット SHA・固定ロックファイル（`bun install --frozen-lockfile`）から、検証環境用の変数でビルドし、検証用の Worker へデプロイする。
   接続先の検証用の変数（`NEXT_PUBLIC_*`）と Cloudflare の API トークンは GitHub Environments の `staging` に置き、変数名は本番と同じにする（接頭辞は付けない）。
   ビルド時のフラグ（`NEXT_PUBLIC_USE_MSW`・#353 の開発用 R2 のフラグ）は Environment に置かず、ワークフローの `env:` に固定する。
   `staging` もデプロイできるブランチを main のみに制限し、管理者による保護ルールのバイパス（Allow administrators to bypass configured protection rules）を無効にする
   （承認者は付けない）。バイパスは既定で有効で、有効のままだと管理者が main 以外の実行で検証用トークンを使えてしまうおそれがある。
   Environment に変数を定義し忘れると同じ名前のリポジトリの Variables が使われるため、ビルドの前に接続先が検証用であることを、
   ワークフローに書いた期待値と比べて確かめる（Deployment.md「環境変数」）。
3. **本番へのデプロイ**: GitHub Environments の `production` に承認者（Required reviewers）を設定し、承認されてから行う。
   - 本番用に、同じコミット SHA から本番用の変数でビルドし直してデプロイする。検証環境のビルド成果物は使い回さない。
   - 検証と本番は同一ワークフロー実行で行い、本番ジョブは検証ジョブに `needs` で依存させる。
     デプロイのジョブは main への `push` で起動した実行の中で動かす（今の `ci.yml` に足し、品質チェックのジョブに `needs` で依存させる）。
     `workflow_run` と `pull_request_target` では起動しない。どちらも `GITHUB_SHA` が「デフォルトブランチの最新のコミット」、
     `GITHUB_REF` が「デフォルトブランチ」になるため、起動元のコミットとデプロイするコミットがずれ、
     PR から起動した実行でも Environment の「main のみ」の制限を通ってしまう。
   - 両方のジョブで実行の `github.sha`（push された main の先頭のコミット。同じ実行の中と再実行で変わらない）を checkout する。
     検証ジョブの出力（`outputs`）でコミットを受け渡さない（出力は検証ジョブの中で動くコードが書き換えられる）。
     デプロイした SHA はジョブのサマリーに書き出す。
   - **本番を古いコミットに戻さない**: 承認待ちが複数溜まると、後から古い実行を承認して本番が巻き戻るおそれがある。次のように防ぐ。
     - 本番ジョブ・検証ジョブそれぞれに、ジョブ単位の `concurrency` のグループを付け、`cancel-in-progress: false` と `queue: max` にする。
       `cancel-in-progress: false` でデプロイを途中で中断せず、同じ環境へのデプロイは同時に 1 つだけになる。
       既定（`queue: single`）では待機できるのは 1 つだけで、新しく来たジョブが待機中のジョブを取り消す。
       ジョブがグループに入る順が入れ替わると、最新のコミットのジョブが古いコミットのジョブに取り消されうるため、`queue: max`（最大 100 件を取り消さずに待機させる）にする。
       それでも最新のコミットの実行が取り消されたときは、その実行を再実行する（`github.sha` は変わらないため、最新かの確認を通る）。
     - 検証ジョブは、デプロイの直前に `github.sha` が main の最新のコミットと一致するかを確かめる。
       一致しなければ検証環境へデプロイせず、ジョブを失敗させる（理由が分かるメッセージを出す）。本番ジョブは `needs` により実行されず、承認の依頼も出ない。
     - main の最新のコミットは、確認のステップの `env:` にだけ `GH_TOKEN: ${{ github.token }}`（`contents: read`）を渡し、`gh api` で取得する。
       `persist-credentials: true` に戻したり、リポジトリが public であることに頼ったりしない。取得できなかったときもデプロイせずに失敗させる。
     - 本番ジョブも、承認の後、デプロイの直前に同じ確認をし、一致しなければデプロイせずにジョブを失敗させる。
       デプロイしなかったジョブを成功で終えると、出していないコミットが Environment のデプロイの記録に成功として残り、本番の中身を誤って判断するためである。
       最新のコミットは、それを含む後の実行で検証・承認して出す。
     - `concurrency` だけでは順序を保証できない。承認待ちのジョブが同時実行の制御で「実行中」「待機」のどちらに当たるかが公式に書かれておらず、
       ジョブがグループに入る順もコミットの順とは限らないためである。
     - 古い実行の承認待ちは却下（Reject）する。承認しても本番には出ないうえ、承認待ちが「実行中」として扱われる場合は、
       却下しないと後の実行の本番ジョブが進まない。
     - デプロイを含む実行の起動（main への push）には、paths フィルタ（`paths-ignore` など）を付けず、`[skip ci]` も使わない。
       main の最新のコミットに対応する実行がないと、どの実行も最新かの確認を通らず、本番に出せなくなる。
   - 今の `ci.yml` は、ワークフロー単位で `concurrency`（`group: ci-${{ github.ref }}`、`cancel-in-progress: true`）を使っている。
     このままデプロイのジョブを足すと、main への次の push でデプロイ中の実行も中断される。
     また、承認待ちの実行がこのグループを持ち続ける場合、次の push の実行（検証環境へのデプロイを含む）が待たされ、さらに次の push で取り消される。
     そのため main への push の実行は、ワークフロー単位のグループに入れない（push のときはグループ名に `github.run_id` を含めるなど。#330 で実装）。
     順序の制御は、上のジョブ単位のグループと最新かの確認だけで行う。
   - 接続先の本番用の変数（`NEXT_PUBLIC_*`）と Cloudflare の API トークンは `production` 環境に置き、承認を通ったジョブだけが使えるようにする。
     どちらのトークンもリポジトリの Secrets には置かない（Environment の Secrets はその Environment を参照するジョブだけが使えるが、
     リポジトリの Secrets は Environment を参照しないジョブからも使える）。
   - ビルドとデプロイはステップを分け、トークンはデプロイのステップの `env:` にだけ渡す。
     ビルドは `opennextjs-cloudflare build`、デプロイは `opennextjs-cloudflare deploy` で行い、両方を続けて実行する `bun run deploy` は CI では使わない。
     同じジョブのステップはファイルを共有するため、これはトークンの露出を減らすだけである。主な防御は次の権限の絞り込みである。
   - デプロイのジョブには `permissions: contents: read` を明示し、`actions/checkout` は `persist-credentials: false` にする。使う Action はコミット SHA で固定する。
     ジョブ単位の `permissions` は品質チェックのジョブから引き継がれず、リポジトリの既定（2026-10-26 時点で read）は設定で変わりうるため、
     Cloudflare のトークンを扱うジョブに、GitHub への書き込み権限を渡さないよう明示する。
   - 検証用と本番用でトークンを分ける。どちらも、Individual Workers（Worker 単位）のスコープで対象 Worker の Editor だけにする。
     - ゾーンの Workers Routes Write は、どちらのトークンにも付けない。ルートの変更は Worker の Editor とゾーンの Workers Routes Write ででき、
       Workers Routes Write はゾーン全体に効く。検証用に付けると本番のドメインを検証用 Worker に向け替えて承認を迂回でき、
       本番用に付けると API のホスト名（`natueve-api.natuportal.org`。同じゾーンの中継用 Worker の Custom Domain。NatuEve_API ADR-0034）を
       本番フロントの Worker に付け替えて、API への通信を横取りできてしまう。
     - アカウント単位の Workers の権限も、どちらにも付けない（同じアカウントにある API の中継用 Worker も書き換えられるため）。
     - Worker の新規作成（Worker 単位の Editor ではできない）と、本番・検証の Custom Domain の割り当ては、CI のトークンでなく管理者がダッシュボードで行う。
       `wrangler.jsonc` には Custom Domain を書かず、最上位も `env.staging` も `"routes": []` にする（Custom Domain は Worker 単位のロールにも未対応）。
     - 権限の詳細と、実機で確かめる事項は Deployment.md「Cloudflare の API トークン」を参照。
   - `production` 環境の設定: 管理者による保護ルールのバイパス（Allow administrators to bypass configured protection rules）を無効にし、
     デプロイできるブランチを main のみに制限する。自分が起動した実行を自分で承認できなくする設定（Prevent self-review）を有効にする。
     main にマージした本人（実行を起動した人）は自分のデプロイを承認できず、承認は必ず別の人が行う。
   - **Environment は、デプロイのワークフロー（#330）を main に入れる前に管理者が作り、保護ルールを設定しておく**:
     存在しない Environment を参照するワークフローを実行すると、その名前の Environment が保護ルール・Secrets なしで自動で作られる
     （[Managing environments for deployment](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)）。
     そのまま後から Secrets を足すと、承認なしで本番用のトークンを使える状態になりうるため、自動作成に頼らない。
     - 管理者が `staging`・`production` を作り、決定 2 と上の設定（デプロイできるブランチを main のみ、管理者のバイパスを無効、
       `production` には Required reviewers と Prevent self-review）を入れてから、変数・Secrets を置く。
     - #330 の PR をマージする前に、設定を `gh api repos/{owner}/{repo}/environments/{name}`（`can_admins_bypass`・`protection_rules`・
       `deployment_branch_policy`）と `.../environments/{name}/deployment-branch-policies` で確かめる。
     - 承認待ちになることは、デプロイのステップを持たない確認用のジョブ（`environment: production` を参照するだけで、ビルド・デプロイをせず、トークンも使わないもの）で確かめる。
       承認待ちになることを確かめてから、デプロイのステップを足す。実際にデプロイするジョブで確かめると、承認待ちにならなかったときに取り消しが間に合わず本番に出るおそれがある。
       決定 6 で本番ジョブを #351 まで無効にしておく間は、本番ジョブの代わりにこの確認用のジョブを置けばよい（#330 で実装）。
4. **検証環境の構成**: 本番と同じ構成にし、接続先はビルド時の環境変数で切り替える。アプリの実行時の分岐（環境ごとに処理を変えるコード）は作らない。
   ビルド時の設定（`next.config.ts` の `remotePatterns`）は、`NEXT_PUBLIC_USE_MSW`・#353 の開発用 R2 のフラグ・開発環境（`next dev`）に限り、ビルド時の設定で分岐してよい。
   フラグは本番のビルドでは立てず、本番の許可リストに開発用・モック用の取得元を入れない（ADR-0002・#334）。
   開発環境（`next dev`）はデプロイ対象外であり、起動後の `.env.local` 変更が `next.config.ts` に反映されないため、`NEXT_PUBLIC_USE_MSW` の値に関係なくモック用取得元を許可する（#367）。本番・検証ビルドには影響しない。
   分けるものは次のとおり。

   | 対象 | 検証環境で用意するもの | 環境変数 |
   |---|---|---|
   | Cloudflare Workers（検証用の Worker） | 検証用の Worker（本番とは別名。初回は管理者が作る） | —（`wrangler.jsonc` の `env.staging` で分ける。下記の注意を参照） |
   | NatuEve_API | 検証用 API のオリジン（NatuEve_API ADR-0036 の検証用 Cloud Run＋検証用中継 Worker） | `NEXT_PUBLIC_API_BASE_URL` |
   | Supabase Auth | 検証用プロジェクトの Auth（決定事項 5） | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | R2 の公開ドメイン | ローカル開発用のバケットを共用する（NatuEve_API ADR-0039。公開ドメイン `assets-dev.natuportal.org`） | `next.config.ts` の `remotePatterns` に、本番以外のビルドのフラグで加える（#353。本番と同じ `pathname` 制限を付ける）。検証環境のビルドではフラグを立て、本番のビルドでは立てない |
   | R2 の CORS | ローカル開発用のバケットの CORS に、検証フロントのオリジンを加える（NatuEve_API ADR-0039。API 側の作業） | — |
   | モック | 使わない（本番と同じ） | `NEXT_PUBLIC_USE_MSW=false`（GitHub Environment の変数には置かず、ワークフローの `env:` に固定する。#330 で実装） |
   | CORS | 検証用 API の `CORS_ALLOW_ORIGINS` に検証フロントのオリジンを登録する（API 側の作業） | — |
   | Supabase Auth のリダイレクト許可 | 検証用プロジェクトに `https://<検証オリジン>/auth/callback` を登録する（#332 の検証版） | — |
   | 独自ドメイン | 検証用のサブドメイン（例: `natueve-web-staging.natuportal.org`。最終決定は #328 と合わせて行う） | — |

   - 共有するもの: Cloudflare のアカウント（Workers Paid・R2・Images・DNS・`natuportal.org` ゾーン）、GitHub のリポジトリ、
     R2 のローカル開発用のバケット（ローカル開発と検証環境で共用。NatuEve_API ADR-0039）。
   - `env.staging` の注意（#330 で実装）:
     - `"routes": []` を必ず書く。`routes` は `env` に引き継がれるため、最上位に将来ルートが足されても検証用 Worker に付かないよう明示する
       （wrangler 4.150.0 の `validateRoutes` は、最上位に Custom Domain があるときに警告を出すだけで止めない）。
       検証用の Custom Domain は管理者がダッシュボードで割り当てる。
     - `"workers_dev": false` と `"preview_urls": false` も書く。どちらも最上位から引き継がれるが、最上位の変更に左右されないよう明示する
       （`routes` が空のときに `workers_dev` を省略すると、既定が `true` になる。Deployment.md「割り当て方法」）。
     - `services` と `images` は `env` に引き継がれないため、`env.staging` で宣言し直す。
       `WORKER_SELF_REFERENCE` は検証用 Worker の名前（既定では `<name>-staging`）を指す。最上位からそのまま写すと本番の Worker を指してしまう。
   - 未決（#330・#328 で決める）: 検証用 Worker の名前、検証用サブドメイン名、検証用の Custom Domain の割り当て時期。
5. **検証用の Auth**: NatuEve_API ADR-0036 の検証用 Supabase プロジェクトの Auth を使う。
   フロント用に Auth プロジェクトを別途作らない。本番の共有 Auth は使わない。
   検証用プロジェクトには本番のデータをコピーせず、テスト用のデータを使う。
6. **画像最適化の `pathname` 制限が完了するまで、検証環境も公開しない**（#351。開発用の取得元を外す #334 は完了済み）。
   `NEXT_PUBLIC_USE_MSW=true` でビルドするプレビュー環境も同様。変換枠を検証環境・プレビュー環境経由で消費しうるため（ADR-0002）。
   #351 より先に #330（デプロイのワークフロー）が入った場合は、次のように扱う。
   - 検証環境: デプロイはしてよいが公開しない（Custom Domain を割り当てず、`workers_dev`・`preview_urls` も無効のまま）。
   - 本番: 本番ジョブを #351 が終わるまで無効にしておき、承認の依頼を出さない（#330 で実装）。

## 理由

- **ブランチを増やさない**: 本番に出す前の確認に必要なのは、本番と同じ構成の検証環境である。
  ブランチはどの時点のコードを載せるかの目印にすぎず、main の内容を検証環境に載せれば確認できる。
  dev を挟むと次の負担が増える（NatuEve_API ADR-0036 と同じ）。
  - 本番の緊急修正を main に直接入れたとき、dev へ戻し忘れると次のリリースで修正が消える。
  - リリースが「dev に溜まった変更すべて」の単位になり、1 つの変更に問題があると他の変更も止まる。
  - dev → main の PR は中身がレビュー済みで、確認が形だけになりやすい。
- **同じコミットからビルドし直す（成果物の使い回しはしない）**: `NEXT_PUBLIC_*` がビルド時に埋め込まれるため、
  検証環境のビルド成果物を本番に出すと、本番でも検証用の API・Auth に繋がってしまう。
  同じコミット SHA と固定ロックファイルから環境ごとにビルドすれば、コードの同一性は保てる。
  `production` の変数・トークンを承認前のジョブに露出させない点も、NatuEve_API ADR-0036 の「承認を通ったジョブだけが本番用の認証情報を使える」と同じになる。
- **承認に GitHub Environments を使う**: public リポジトリのため Free プランで使え、追加のサービスや費用が要らない。
  承認者と承認の記録が GitHub に残り、承認を通ったジョブだけが本番用の変数・トークンを使える。
- **検証用の Auth を分ける**: 本番の共有 Auth を使うと、テスト用アカウントが本番の Auth に入り、NatuPortal の他のプロダクトにもログインできてしまう。
  また、本番の利用者のトークンで検証用フロントから検証用 API を呼べてしまう。
  検証用プロジェクトの Auth を使う方針は NatuEve_API ADR-0036 の決定事項 5 と同じ。
- **本番のデータをコピーしない**: 本番の DB には希少種の生息地の座標と個人情報がある。
  検証環境の接続先に複製すると、座標保護（NatuEve_API の CLAUDE.md「座標情報の保護」）の対象が、守りの弱い環境に広がる。
  NatuEve_API ADR-0036 と同じ理由。
- **検証環境にも固定オリジンを付ける**: API の CORS がワイルドカード非対応のため、
  毎回変わるプレビュー URL では検証環境として機能しない（Supabase Auth の Redirect URLs はワイルドカードも使えるが、
  検証用プロジェクトには検証オリジンの `/auth/callback` を登録する）。
- **トークンを検証用と本番用で分け、どちらもルートを変えられないようにする**: 検証環境は main へのマージで自動実行されるため、侵害・誤設定の影響を受けやすい経路である。
  Cloudflare の API トークンがアカウント単位の権限だと、検証用トークンで本番 Worker も更新でき、承認を迂回できてしまう。
  Worker 単位に絞っても、ゾーンの Workers Routes Write があれば本番のドメインを検証用 Worker に向け替えられるため、検証用トークンには付けない。
  本番用も、アカウント単位にすると同じアカウントの API の中継用 Worker まで書き換えられ、
  ゾーンの Workers Routes Write を付けると API のホスト名を付け替えられるため、どちらも付けない。
  Custom Domain の割り当ては一度きりの作業なので、管理者がダッシュボードで行っても負担は小さい。
  トークンを `staging`・`production` の Environment の Secrets に置き、デプロイできるブランチを main のみに制限して管理者のバイパスを無効にすれば、
  main 以外のブランチのジョブや PR のワークフローからは使えない。
- **検証と本番を同一実行にし、`github.sha` で一致を保証する**: 承認待ちの間に main が進むと、検証していないコミットが本番に出る。
  本番ジョブを検証ジョブに `needs` で依存させ、両方で実行の `github.sha` を checkout すれば、検証したものだけが出る。
  さらにデプロイの直前に main の最新と一致するかを確かめれば、検証済みでも古いコミットを後から出して本番を巻き戻すことはない。

## 影響（結果）

### 良い影響

- 長期ブランチがないため、main と別ブランチのずれが起きない。issue と PR は 1 対 1 のまま。
- 本番に出す前に、本番と同じ構成（検証用 API・検証用 Auth・別 Worker）で結合を確認できる。
- 本番用の変数・トークンは承認を通ったジョブだけが使える。
- Workers Paid の固定費は増えない（検証用 Worker を足しても月 $5 のまま）。

### トレードオフ・制約

- **main の意味が変わる**: main は「本番に出ている内容」ではなく「次に本番へ出す候補」になる。
  本番に出ている内容は、承認されたデプロイの記録で確かめる。
- **緊急修正も承認を待つ**: 承認者が誰も応じられないと、本番の緊急修正も出せない。
  承認者は最大 6 人（ユーザーまたはチーム）まで登録でき、承認は 1 人で足りるため、複数人を登録しておく。
  Prevent self-review を有効にするため、実行を起動した人（main にマージした人）は承認できない。承認者は少なくとも 2 人登録し、
  起動した人以外の誰かが応じられるようにする。
  承認待ちは最大 30 日で、それを過ぎると失敗になる（NatuEve_API ADR-0036 と同じ）。
- **本番に出せるのは main の最新のコミットだけ**: 承認待ちの間に main へ次のマージが入ると、古い実行は承認しても本番に出ない
  （最新かの確認で失敗し、実行は失敗として残る）。
  後の実行（新しいコミットを含む）が検証環境に出てから、それを承認する。マージが続く間は本番に出すのを待つことになる。
- **本番を前の版に戻すときも revert の PR を通す**: 不具合のある版を本番に出したときは、revert の PR を通常の経路（検証環境 → 承認 → 本番）で出す。
  古い実行の再実行では、最新かの確認で止まるため戻せない。
  Cloudflare 側のロールバック（ダッシュボード・`wrangler rollback`）は、承認を経ずに本番が変わり main とずれるため使わない。
  戻るまでに PR・CI・承認の時間がかかる。
- **検証環境の公開にも #351 の完了が要る**: `pathname` 制限が入るまで検証環境も公開しない。
  その間は検証環境での結合確認ができない。
- **無料枠・含まれる量を本番と分け合う**:
  - Workers Paid の含まれる量（月 1,000 万リクエスト・CPU 3,000 万ミリ秒）は本番と検証で共有する。
  - Cloudflare Images の無料枠（月 5,000 ユニーク変換）は共有しうる前提で扱う（共有範囲の公式の明記なし）。
- **検証環境の確認には API 側の検証環境が要る**: 検証用 API（NatuEve_API #219・#226 の検証）が動いていないと、
  フロントの検証環境だけでは結合を確認できない。CORS と Auth のリダイレクト許可の登録も API 側・Supabase 側の作業になる。
- **#329・#330 の受け入れ基準は更新済み**: #330 は「GitHub Actions に決定」と「検証環境（`staging`）の変数の値（`NEXT_PUBLIC_API_BASE_URL` など）を決める」に更新済みである。
  #329 も `production` Environment の変数を前提に更新済みで、`BUN_VERSION` は使わず、`NEXT_PUBLIC_USE_MSW` はワークフローの `env:` に固定する（本 ADR と同じ）。
  残る未決は、ブランチごとのプレビュー環境（Deployment.md の未決事項 7）と、検証環境の変数の値・検証用 Worker の名前・検証用サブドメイン名・検証用の Custom Domain の割り当て時期（決定 4）で、
  引き続き #330・#328 で扱う。ワークフローの実装は #330 で行う。

## 検討した代替案

- **main ← dev ← 作業ブランチ（dev を検証環境、main を本番に対応させる）**: 「main ＝ 本番」が分かりやすく、決まった日にまとめて出す運用に向く。
  ただし「理由」に書いたずれ・一括リリース・PR が形だけになる負担があり、承認付きで同じコミットを出せば同じ確認ができる。不採用。
- **Workers Builds のブランチごとのプレビュー URL を検証環境にする**: URL が変わるたびに API の `CORS_ALLOW_ORIGINS` と
  Supabase の Redirect URLs への登録が必要だが、API はワイルドカード非対応で登録が追いつかない。
  #351 が終わるまで公開できない点も同じ。不採用（本番デプロイ後に別途プレビューを設けることは妨げない）。
- **検証環境のビルド成果物を本番にそのまま出す（API と同じダイジェスト方式）**: `NEXT_PUBLIC_*` が埋め込まれるため、
  本番でも検証用の接続先を指したままになる。不採用。
- **検証環境の接続先に本番の API・Auth を使う**: テスト用の書き込みが本番 DB に入り、テスト用アカウントが本番の共有 Auth に入る。
  NatuPortal の他プロダクトへの影響もある。不採用。
- **SSR 側の中継（`rewrites`・Route Handler）で接続先を実行時に切り替える**: ビルドし直さずに済むが、
  ADR-0001 の「API は `NEXT_PUBLIC_API_BASE_URL` へ直接呼ぶ。本番では `rewrites` による中継を使わない」を覆すことになる。
  中継用の Worker・秘密情報の管理と遅延も増える。不採用。
- **`upload`（versions upload）＋段階的リリースで検証と本番を切り替える**: バージョンの切り替え自体はできるが、
  `NEXT_PUBLIC_*` が環境ごとに違う以上、環境ごとのビルドは避けられない。単独では不採用（#330 で併用は妨げない）。
