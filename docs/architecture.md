# アーキテクチャ

## 概要

本プロジェクトは、Next.js App Router を採用したフロントエンドアプリケーションです。

保守性・再利用性・可読性を重視し、Atomic Design をベースとしたコンポーネント設計を採用しています。

また、画面（UI）・ロジック・API通信・型定義などの責務を明確に分離することで、変更に強い構成を目指しています。

---

## 設計方針

本プロジェクトでは以下の方針で設計を行います。

- 責務を明確に分離する
- 既存実装との一貫性を最優先する
- コンポーネントの再利用を促進する
- UIとロジックを可能な限り分離する
- API通信を画面から直接行わない
- 型安全を重視する
- 小さく責務の明確なコンポーネントを組み合わせて画面を構築する

---

# ディレクトリ構成

```
src/
├── app/
├── components/
│   ├── atoms/
│   ├── molecules/
│   ├── organisms/
│   ├── templates/
│   ├── layouts/
│   └── ui/
├── constants/
├── hooks/
├── lib/
├── mocks/
├── services/
├── styles/
├── types/
└── utils/
```

---

# ディレクトリの責務

## app

Next.js App Router のページを管理します。

責務

- page.tsx
- layout.tsx
- loading.tsx
- error.tsx
- route.ts

ルーティングに関する責務のみを持ちます。

画面の実装は可能な限り components に委譲してください。

---

## components

画面を構成する UI コンポーネントを管理します。

Atomic Design に従って構成します。

### atoms

最小単位のコンポーネントです。

例

- Button
- Input
- Badge
- Icon

---

### molecules

複数の atoms を組み合わせたコンポーネントです。

例

- SearchBox
- UserCardHeader
- FormField

---

### organisms

画面の主要な機能を構成するコンポーネントです。

例

- EventList
- EventPostForm
- UserProfile

---

### layouts

アプリ全体で利用するレイアウトを管理します。

例

- Header
- Footer
- Sidebar

---

### ui

shadcn/ui のコンポーネントを配置します。

基本的には直接編集せず、必要に応じてラップしたコンポーネントを利用してください。

---

# services

API通信を担当します。

責務

- API呼び出し
- リクエスト送信
- レスポンス取得

UIコンポーネントから直接 fetch を呼び出してはいけません。

すべて services を経由してください。

---

# hooks

画面で利用するロジックを管理します。

責務

- 状態管理
- API呼び出し
- 共通ロジック

UIとは分離してください。

---

# types

型定義を管理します。

責務

- API型
- Entity型
- 共通型

可能な限り既存型を再利用してください。

---

# utils

汎用的な関数を配置します。

責務

- 日付変換
- フォーマット
- 計算処理

React依存の処理は配置しません。

---

# constants

共通定数を配置します。

例

- APIエンドポイント
- 定数値
- メッセージ

---

# mocks

MSW(Mock Service Worker) を管理します。

責務

- handler
- mockデータ
- 開発用API

API仕様が変更された場合は mocks も更新してください。

---

# styles

グローバルスタイルを管理します。

責務

- globals.css
- 共通スタイル

Tailwind CSS を基本とし、最小限の利用とします。

---

# コンポーネント設計

Atomic Design を採用しています。

```
Atoms
 ↓
Molecules
 ↓
Organisms
 ↓
Templates
 ↓
Pages(app)
```

コンポーネントはできる限り小さく保ち、責務を明確にしてください。

---

# データの流れ

基本的なデータの流れは以下の通りです。

```
Page(app)

↓

Template

↓

Organism

↓

Hook

↓

Service

↓

API
```

画面から直接 API を呼び出さず、Hook・Service を経由することで責務を分離します。

---

# 状態管理

状態管理は以下を基本とします。

- コンポーネント内のみで利用する状態
  - useState

- 共通ロジック
  - Custom Hooks

グローバル状態管理が必要になった場合は、チーム内で検討したうえで導入します。

---

# エラーハンドリング

エラー処理は以下の責務で行います。

Service

- APIエラーの取得

Hook

- エラー状態の管理

UI

- エラーメッセージの表示

---

# 実装時の優先順位

新しい機能を追加する際は以下の順番で確認してください。

1. 同様の画面が存在するか
2. 再利用可能なコンポーネントが存在するか
3. 共通Hookが存在するか
4. 共通Serviceが存在するか
5. 共通Utilが存在するか

既存実装を優先してください。

---

# AIへの指針

AIエージェントは、新しい実装方法を提案する前に、既存コードを調査してください。

プロジェクト内で既に採用されている実装方針・命名規則・責務分離を尊重し、一貫性を維持することを最優先としてください。

また、ディレクトリ構成や責務を変更する提案を行う場合は、その理由と影響範囲を明確に説明してください。