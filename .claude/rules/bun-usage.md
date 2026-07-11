# Bun 使用ルール

> 適用対象: `package.json`, `bun.lockb`, `bunfig.toml`。
> このファイルは `.claude/rules/` から常時自動ロードされる。

## Bun はパッケージマネージャーとしてのみ使用

### OK
- `bun install` / `bun add` / `bun remove`（パッケージ管理）
- `bun run <script>`（npm scripts 実行）
- `bunx <package>`（npx 代替）
- CI: `bun install --frozen-lockfile`

### NG
- `--bun` フラグ（Bun ランタイムを有効にする）
- `bun <file.ts>` での直接実行（Node.js ランタイムを使う）
- `Bun.serve()` 等の Bun 固有 API
