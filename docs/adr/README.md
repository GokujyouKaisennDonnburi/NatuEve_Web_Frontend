# Architecture Decision Records (ADR)

このディレクトリは、NatuEve_Web_Frontend における重要な設計上の意思決定を記録する。
「なぜその技術・構成を選んだのか」を後から追えるようにするためのもの。

## 運用ルール

- 1 ファイル = 1 決定。ファイル名は `NNNN-短いスラッグ.md`（連番は 4 桁ゼロ埋め）。
- 新規作成時は [`template.md`](./template.md) をコピーし、下の一覧表に行を追加する。
- 一度 Accepted にした ADR は原則書き換えない。決定を覆す場合は新しい ADR を起こし、
  旧 ADR のステータスを `Superseded by ADR-XXXX` に更新する。
- ステータス: `Proposed`（提案中） / `Accepted`（採用） / `Deprecated`（非推奨） / `Superseded`（置換済み）。
- バックエンド（NatuEve_API）の ADR は別リポジトリで管理している。参照するときは `NatuEve_API ADR-XXXX` と書く。

## 一覧

| ADR | タイトル | ステータス |
|---|---|---|
| [0001](./0001-deploy-cloudflare-workers-opennext.md) | フロントエンドを Cloudflare Workers（Paid）に OpenNext でデプロイする | Accepted |
| [0002](./0002-use-cloudflare-images-binding.md) | `next/image` の画像最適化に Cloudflare Images の `IMAGES` バインディングを使う | Accepted |
| [0003](./0003-github-flow-staging-approval.md) | GitHub Flow を続け、main へのマージで検証環境へ、承認後に本番へデプロイする | Accepted |
