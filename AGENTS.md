# AIエージェント向け共通ルール

## 基本方針

- 推測で実装しない
- 必ず既存実装を確認する
- 一貫性を最優先する
- 不明点はユーザーへ確認する

## 実装

- 新しい設計より既存実装を優先する
- 再利用可能なコンポーネントを優先する( Atomic Design )
- 技術スタックは[README.md](README.md)を参照する
- [docs/skill/architecture.md](docs/skill/architecture.md) を参照する
- [docs/skill/coding-rules.md](docs/skill/coding-rules.md) を参照する

## 危険な操作

以下は必ず事前に確認を取ってください。

- install
- update
- delete
- git commit
- git push
- git reset
- package変更

## レビュー

レビュー時は

- 問題点
- 理由
- 改善案

を簡潔に説明する。

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
