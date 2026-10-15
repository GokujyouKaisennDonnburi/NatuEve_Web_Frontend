# ADR-0002: `next/image` の画像最適化に Cloudflare Images の `IMAGES` バインディングを使う

- ステータス: Accepted
- 日付: 2026-10-16
- 関連: #327, #334, ADR-0001

## コンテキストと課題

ADR-0001 でフロントエンドを Cloudflare Workers（OpenNext）にデプロイすることを決めた。
画像最適化の方式（最適化なしか、Cloudflare Images か）は導入時に決めることになっていた（ADR-0001 の決定 3）。

- OpenNext で `next/image` の最適化を使うには、`wrangler.jsonc` の画像バインディングか独自 loader のどちらかが必要。
- 最適化を使っている箇所: SiteHeader（ロゴ）、EventCard（主催者アバター）、イベント詳細・活動レポートの画像カルーセル。
  ヘッダーロゴは `public/images/NatuEve_logo.png`（約 1.4MB）で、全ページに表示される。
- 画像の取得元は R2 の公開ドメイン（`assets.natuportal.org`）と Google のプロフィール画像（`lh3.googleusercontent.com`）を想定。
- 費用は小さく抑えたい。

## 決定

`wrangler.jsonc` に `images.binding: "IMAGES"` を追加し、Cloudflare Images の `IMAGES` バインディングで
`next/image` の画像最適化を有効にする。

## 理由

- OpenNext が標準で対応している方式で、設定の追加だけで有効にできる（ページのコード変更が不要）。
- ロゴ 1.4MB やイベント写真が元のサイズで配信されるのを避けられる。実測ではロゴが WebP 約 2KB、
  イベント画像（1200x600 の JPEG）が w=640 で約 19KB・w=1920 で約 125KB になった。
- 月 5,000 ユニーク変換まで無料で、初期規模なら追加費用はほぼ発生しない見込み。
- `images.remotePatterns` による取得元の制限がそのまま効くため、無関係な画像を変換させられにくい。

## 影響（結果）

### 良い影響

- 画像の転送量が減り、表示が速くなる（特に全ページ共通のヘッダーロゴ）。
- 依存パッケージの追加やページの実装変更が不要（`wrangler.jsonc` の設定のみ）。

### トレードオフ・制約

- ユニーク変換 月 5,000 回を超えると新規変換がエラーになり画像が表示されなくなる（キャッシュ済みは配信継続）。
  継続して使うには Images Paid の契約が必要（最初の 5,000 変換を含み、1,000 変換あたり $0.50）。Workers とは別の課金。
- `images.minimumCacheTTL` は OpenNext では未対応。最適化レスポンスには `Cache-Control` が付かず CDN にキャッシュされないため、
  デプロイ前に `/_next/image*` への Cache Rule を設定する（またはキャッシュ不要と実測で確認する）。
- ローカルの `preview`（`wrangler dev`）の `IMAGES` は low-fidelity 実装のため、`fit`・`quality` の効き方が本番と異なる場合がある。
- 許可する画像の取得元の絞り込みが必要。モック用ホストは `NEXT_PUBLIC_USE_MSW=true` のビルドでのみ許可し、本番ビルドには含めない。
  残る本番の取得元（パス）の制限は #334 で対応し、完了までデプロイしない。

## 検討した代替案

- **最適化なし（`images.unoptimized: true`）**: 設定 1 行で費用もかからないが、ロゴ（約 1.4MB）と
  イベント写真が元のサイズのまま配信される。不採用。
- **独自 loader（`loaderFile` で `/cdn-cgi/image/...` を使う）**: Cloudflare Images の URL 変換を直接使う方式。
  `images.remotePatterns` が効かず、許可する取得元を Cloudflare のダッシュボードで管理する必要がある。
  OpenNext の実行パスから外れるため、`IMAGES` バインディングで足りる本件では不採用。
- **バインディングを設定しない**: OpenNext 1.20.11 では警告を出して元画像を返すだけで、実質「最適化なし」と同じ。不採用。
