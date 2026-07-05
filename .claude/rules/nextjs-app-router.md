# Next.js App Router ルール

> 適用対象: `app/**/*.tsx`, `app/**/*.ts`。
> このファイルは `.claude/rules/` から常時自動ロードされる（新規ページ・コンポーネント作成時にも確実に適用するため、意図的にパススコープを付けていない）。

## 規約
- Server Components をデフォルトとする
- `'use client'` はインタラクションが必要なコンポーネントにのみ付与
- データフェッチは Server Components で行う（`fetch` + RSC）
- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` の命名規約に従う
- メタデータは `generateMetadata` で動的に設定

## 禁止
- Pages Router（`pages/` ディレクトリ）は使わない
- `getServerSideProps`, `getStaticProps` は使わない（App Router の機能を使う）
