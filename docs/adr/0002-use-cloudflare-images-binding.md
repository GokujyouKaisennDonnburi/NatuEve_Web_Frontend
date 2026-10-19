# ADR-0002: `next/image` の画像最適化に Cloudflare Images の `IMAGES` バインディングを使う

- ステータス: Accepted
- 日付: 2026-10-16
- 関連: #327, #334, ADR-0001

## コンテキストと課題

ADR-0001 でフロントエンドを Cloudflare Workers（OpenNext）にデプロイすることを決めた。
画像最適化の方式（最適化なしか、Cloudflare Images か）は導入時に決めることになっていた（ADR-0001 の決定 3）。

- OpenNext で `next/image` の最適化を使うには、`wrangler.jsonc` の画像バインディングか独自 loader のどちらかが必要。
- 最適化を使っている箇所: SiteHeader（ロゴ）、EventCard（主催者アバター）、イベント詳細・活動レポートの画像カルーセル。
  ヘッダーロゴは `src/assets/images/NatuEve_logo.png`（約 1.4MB、静的 import）で、全ページに表示される。
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
- ホスト単位の制限はビルド時の `next.config.ts`（`images.remotePatterns`）で効く。
  ただし `lh3.googleusercontent.com` は任意パスの画像を変換でき、パス制限は #334 で対応する。

## 影響（結果）

### 良い影響

- 画像の転送量が減り、表示が速くなる（特に全ページ共通のヘッダーロゴ）。
- 依存パッケージの追加やページの実装変更が不要（`wrangler.jsonc` の設定のみ）。

### トレードオフ・制約

- 費用: ユニーク変換 月 5,000 回まで無料。超過時の挙動・有料化（Images Paid）を含め、詳細は [Deployment.md](../Deployment.md) を参照。
- 最適化レスポンスは自動では CDN にキャッシュされず、デプロイ前の対応が必要（詳細は [Deployment.md](../Deployment.md)）。
- ローカルの `preview`（`wrangler dev`）の `IMAGES` は low-fidelity 実装のため、`fit`・`quality` の効き方が本番と異なる場合がある。
- 許可する画像の取得元のパス制限は #334 で対応し、完了までデプロイしない。変換枠の共有範囲は公式に明記されていないが、
  プレビュー環境とも枠を消費しうる前提で扱う（詳細は [Deployment.md](../Deployment.md)）。

## 検討した代替案

- **最適化なし（`images.unoptimized: true`）**: 設定 1 行で費用もかからないが、ロゴ（約 1.4MB）と
  イベント写真が元のサイズのまま配信される。不採用。
- **独自 loader（`loaderFile` で `/cdn-cgi/image/...` を使う）**: Cloudflare Images の URL 変換を直接使う方式。
  `images.remotePatterns` が効かず、許可する取得元を Cloudflare のダッシュボードで管理する必要がある。
  OpenNext の実行パスから外れるため、`IMAGES` バインディングで足りる本件では不採用。
- **バインディングを設定しない**: OpenNext 1.20.11 では警告を出して元画像を返すだけで、実質「最適化なし」と同じ。不採用。
