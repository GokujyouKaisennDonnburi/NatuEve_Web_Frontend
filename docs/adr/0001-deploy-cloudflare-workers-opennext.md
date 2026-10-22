# ADR-0001: フロントエンドを Cloudflare Workers（Paid）に OpenNext でデプロイする

- ステータス: Accepted
- 日付: 2026-10-13
- 関連: #324, NatuEve_API ADR-0032（バックエンドの本番構成）
- 構成の詳細・設定値・月額試算は [docs/Deployment.md](../Deployment.md) を参照

## コンテキストと課題

フロントエンド（Next.js 15.5・App Router）の本番デプロイ先が未決だった。選定に効く前提は次のとおり。

- 現在のページは、データ取得をすべてブラウザ側（`useEffect` で `apiFetch`）で行っている。
  サーバー側でデータを取得するページはなく、Server Actions・Route Handler・middleware も使っていない。
- 今後、イベントページの SNS シェア機能を追加する予定がある。SNS のクローラーは JavaScript を実行しないため、
  イベントごとの OGP（タイトル・画像）を HTML に含めて返す仕組みが必要になる。
- リポジトリの規約（`.claude/rules/nextjs-app-router.md`）は、Server Components でのデータ取得と
  `generateMetadata` による動的なメタデータ設定を前提にしている。
- バックエンドは Cloud Run＋Supabase（東京リージョン）に決まった（NatuEve_API ADR-0032）。
  画像・PDF の保存先（R2）とドメイン（`natuportal.org`）は Cloudflare で管理している。
- 費用は小さく抑えたい。

## 決定

**フロントエンドは Cloudflare Workers の Paid プラン（月 $5）に、アダプタ `@opennextjs/cloudflare`（OpenNext）を使って
SSR できる形でデプロイする。**

1. ページは Workers 上の Next.js（OpenNext）が SSR で返す。ビルド成果物の静的ファイルは Workers の静的配信で返す。
2. API はブラウザから `NEXT_PUBLIC_API_BASE_URL` へ直接呼ぶ。SSR から呼ぶ場合も同じ。本番では `rewrites` による中継を使わない。
3. 画像最適化の方式（最適化なしか、Cloudflare Images か）は導入時に決める。

## 理由

- **SNS シェアの OGP を Next.js の標準の書き方で実装できる**: SSR があれば `generateMetadata` でイベントごとの OGP を返せる。
  リポジトリの規約（Server Components・`generateMetadata`）ともそのまま一致する。
- **デプロイに必要な改修が設定だけで済む見込み**: コードを読んだ範囲では、追加が必要なのは依存パッケージと設定ファイルで、
  ページのコードは変更しなくてよい。動的ルート（`event/[id]`・`users/[id]`）もそのまま動く見込み。
- **費用が月 $5 で固定される**: 中規模（月 30 万 PV 程度）まで $5 のままの見込み（含まれる量と試算は Deployment.md）。
  無料プランは CPU の上限が低く、SSR は収まらない見込み。
- **表示が速い**: CDN から配信され、止まった状態からの起動待ちがほぼない。SNS のクローラーにもすぐ応答できる。
- **管理先がまとまる**: ドメイン・DNS・R2 と同じ Cloudflare で管理できる。

## 影響（結果）

### 良い影響

- ページのコードを変えずにデプロイできる。
- SNS シェアの OGP は、`event/[id]/page.tsx` をサーバー側のページとブラウザ側の部品に分けて `generateMetadata` を書くだけで追加できる。
- Server Actions・Route Handler・ISR など、Next.js のサーバー機能を将来使える（OpenNext の対応範囲内）。

### トレードオフ・制約

- **OpenNext に依存する**: Next.js 15 は最新のマイナー版だけが対応範囲。Next.js を更新するときは、OpenNext の対応状況を確認する。
  Node 用の middleware と Edge ランタイムには対応していない。
- **Workers のランタイムは Node.js と完全には互換でない**: 使える Node の機能は一部で、ライブラリによっては動かない可能性がある。
- **`experimental.optimizeCss`（critters）は App Router では無効**: ビルドは #326 で検証済み。
  Next.js 15.5.28 は OpenNext 1.20.13 の対応範囲内で、OpenNext のビルドは通る（#342 で更新）。
  ただし critters は Pages Router のみ適用のため、App Router では実質無効
  （CSS は通常どおり配信され、実害なし）。App Router でも同効果が必要になったら別の手段を検討する。
- **環境ごとに再ビルドが必要**: `NEXT_PUBLIC_*` はビルド時に埋め込まれるため。
- **SSR ではログイン状態が分からない**: Supabase のセッションはブラウザに保存している。ログインが必要な画面は、今と同じくブラウザ側でデータを取得する。
- **アクセスがなくても月 $5 かかる**。画像最適化に Cloudflare Images を使うと、無料枠を超えた分の費用も加わる。

## 検討した代替案

- **静的書き出し（`output: 'export'`）＋OGP を差し込む Worker（Workers 無料プラン、$0）**:
  費用はかからない。ただし、動的ルートの 2 ページを作り替える必要があり、OGP を差し込む Worker も自作して保守することになる。
  Server Components でのデータ取得など、リポジトリの規約が前提とするサーバー機能も使えない。不採用。
- **Cloud Run（バックエンドと同じ GCP）**: Next.js と完全に互換で、計算の費用は小規模ならほぼ $0。
  ただし、独自ドメインには公式推奨のロードバランサー（転送ルールだけで約 $18/月）が必要で、無料の domain mapping は Preview 段階で本番に非推奨。
  CDN がなく JS・CSS の配信量に応じて通信料がかかり、止まった状態からの起動待ちも出る。不採用。
- **Vercel**: Hobby プランは規約で非商用に限られる。Pro は開発者 1 人あたり $20/月で割高。不採用。
- **Cloudflare Workers の無料プランで OpenNext を使う**: CPU が 1 リクエスト 10ms までで、SSR が収まらない見込み。不採用。
