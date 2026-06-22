# NatuIve_Web_Frontend

なちゅいべの Web フロントエンド。イベントの閲覧・検索・投稿・参加申し込みを行う。

## Tech Stack
- Next.js（App Router）+ TypeScript
- パッケージマネージャー: Bun
- ランタイム: Node.js（**Bun ランタイムは使わない**）
- コンポーネント開発: Storybook

## CRITICAL: Bun の使い方
- `bun install`, `bun add`, `bun remove` → OK（パッケージマネージャー）
- `bun run dev`, `bun run build` → OK（npm scripts の実行）
- `--bun` フラグ → **禁止**（Bun ランタイムを使わない）
- CI では `bun install --frozen-lockfile` を使用
- `bunx` は使用可能（npx の代替）

## Commands
```bash
bun install                  # 依存インストール
bun run dev                  # 開発サーバー起動
bun run build                # プロダクションビルド
bun run lint                 # Lint 実行
bun run storybook            # Storybook 起動
```

## Architecture Rules

### 認証
- Supabase Auth を使用（DB/Storage は使わない）
- 共通ログイン UI パッケージを将来的に複数プロダクトで共有
- Google OAuth は「ウェブ アプリケーション」クライアントタイプ

### 型共有
- OpenAPI 定義から TypeScript の型を自動生成する
- 手書きの API 型定義は作らない
- API クライアントは生成された型を使用

### バリデーション
- フォームバリデーションは UX 補助のみ
- 信頼の境界は API サーバー側

## Conventions
- App Router のファイル規約に従う（`page.tsx`, `layout.tsx`, `loading.tsx` 等）
- Server Components をデフォルトとし、必要な場合のみ `'use client'`
- ドメイン: `natuportal.org`（サブドメイン方式）
- **`.env.local` は絶対に読まない**（Supabase 鍵等のシークレットを含む）。変数名や形式は `.env.example` を参照する

## 詳細ルール
以下を常時参照する（Claude Code の `@import`）。
@.claude/rules/nextjs-app-router.md
@.claude/rules/bun-usage.md
