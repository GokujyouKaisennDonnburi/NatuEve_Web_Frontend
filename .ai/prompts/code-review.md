# Pull Request コードレビュー指示

本 Pull Request に対して、以下の観点でコードレビューを実施してください。
本ファイルは AI サービスに依存しない共通プロンプトです。実行基盤（OpenCode / GitHub Copilot / Claude Code 等）を問わず参照されます。

## 前提

- 対象: React 19 + Next.js 15 + TypeScript のフロントエンド
- 既存スタック: Bun, Biome, Vitest, MSW, Tailwind CSS v4, Radix UI
- 設計ガイドライン: `AGENTS.md` および `docs/skill/` 配下を参照
- コメントは **日本語** で投稿してください

## レビュー観点

以下 9 項目を順に確認し、問題があれば指摘してください。問題なければ該当観点について簡潔にその旨を記載してください。

### 1. TypeScript の型安全性
- `any` / `unknown` の不適切な使用
- 型アサーション（`as`）の乱用
- ジェネリクスの欠如による型情報の消失
- `@/types` 配下の型定義との整合性
- Null / Undefined の取り回し

### 2. React Hooks の利用方法
- 依存配列の過不足（exhaustive-deps 相当）
- 条件分岐内での Hooks 呼び出し
- `useEffect` での非同期処理のクリーンアップ漏れ
- 不要な `useEffect`（派生状態は `useMemo` 等で算出できないか）
- カスタム Hooks（`@/hooks`）の再利用余地

### 3. 不要な再レンダリング
- `useMemo` / `useCallback` の過不足
- インラインオブジェクト・関数の props 受け渡し
- `React.memo` が必要かつ十分か
- `key` prop の不適切な値（index 使用の危険性）
- Context 値の過剰再生成

### 4. コンポーネント責務
- 単一責任原則への違反（1コンポーネントが複数関心を持つ）
- Container / Presentation の分離
- Atomic Design（atoms / molecules / organisms）の階層逸脱
- ビューとロジックの混在
- `components.json`（shadcn/ui）のエイリアス指針との整合

### 5. 状態管理
- `useState` で代替可能なのに外部ストアを使用していないか
- Supabase / サーバ状態とクライアント状態の境界
- 状態のリフトアップ過不足
- 派生状態の保持（ストア不要な値の保持）
- 並び替え・フィルタ状態のURL同期の要否

### 6. アクセシビリティ
- `alt` / `aria-label` / `aria-*` の欠如・誤用
- フォーカス管理（モーダル・メニューの trap / restore）
- キーボード操作可能性（`role` / `tabIndex` / `onKeyDown`）
- フォームの `label` 紐付け
- 色コントラスト・フォーカス表示

### 7. セキュリティ
- XSS: `dangerouslySetInnerHTML` / ユーザ入力の直接描画
- 認証情報・シークレットのフロントエンド露出（`.env.*` の誤用 / `NEXT_PUBLIC_` 過不足）
- Supabase RLS / クライアント側権限の過信
- 外部 URL遷移の `rel="noopener noreferrer"` 漏れ
- `localStorage` / Cookie に保存する機密性

### 8. パフォーマンス
- `next/dynamic` による遅延ロード余地
- `next/image` の未使用（img タグ直接使用）
- フォント・スタイルの最適化（`next/font` / CSS Modules）
- バンドルサイズ増加分（重い依存の一括 import）
- `critters` 設定との整合（CSS の critical inline）
- 不要な `'use client'` 指定による Client 増加

### 9. 可読性・保守性
- 命名（コンポーネント / 変数 / 関数 / ファイル）
- マジックナンバー・重複定数（`@/constants` 利用の余地）
- コメント過不足（AGENTS.md ルール: 不要なコメントは追加しない）
- 長すぎる関数の分割余地
- 既存 `@/utils` / `@/lib` の再利用余地

## 出力フォーマット

各指摘事項は以下の形式で記載してください（`AGENTS.md` のレビュー形式に準拠）。

```
### [観点名] 該当ファイル:行
- 問題点: 何が問題か
- 理由: なぜ問題か
- 改善案: 具体的な修正例（コード片を含む）
```

- 深刻度（high / medium / low）を先頭に付与してください
- 該当箇所が無い観点は `問題なし` のみを記載してください
- 全観点について簡潔に、冗長な前置きは不要です