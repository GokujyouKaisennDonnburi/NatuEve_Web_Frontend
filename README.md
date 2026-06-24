# NatuIve Web Frontend

NatuIve のフロントエンド開発用リポジトリです。

Next.js 15 + React 19 + TypeScript 5 + Tailwind CSS 4 + Biome 2 + MSW 2 + shadcn/ui をベースに構築しています。

Atomic Design を前提としたディレクトリ構成を採用し、初心者から経験者まで開発に参加しやすい構成を目指しています。

---

## 📋 目次

* [概要](#概要)
* [セットアップ](#セットアップ)
* [開発](#開発)
* [技術スタック](#技術スタック)
* [ディレクトリ構成](#ディレクトリ構成)
* [MSW(Mock Service Worker)](#mswmock-service-worker)
* [ドキュメント](#ドキュメント)
* [関連リンク](#関連リンク)

---

## 概要

NatuIve Web Frontend は、Next.js App Router を利用したフロントエンドアプリケーションです。

以下のような開発方針を採用しています。

* Next.js App Router ベース
* TypeScript による型安全な実装
* Atomic Design によるコンポーネント設計
* Tailwind CSS によるスタイリング
* shadcn/ui による UI コンポーネント管理
* Biome によるコード品質管理
* MSW によるモック API 開発

現在のサンプル実装では以下のページを用意しています。

* Home
* Docs
* Users
* Event List
* Event Post

---

## セットアップ

### 前提条件

以下のツールをインストールしてください。

| ツール     | 推奨バージョン   | 用途           |
| ------- | --------- | ------------ |
| Git     | 最新安定版     | ソースコード管理     |
| Node.js | 22 LTS    | 開発補助環境       |
| Bun     | 1.2.21    | パッケージ管理・実行環境 |
| VSCode  | 最新安定版     | 開発エディタ       |

推奨 VSCode 拡張機能

* TypeScript
* Biome

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>

# プロジェクトへ移動
cd <project-name>

# 依存関係をインストール
bun install
```

### 環境変数

現在は環境変数を使用していません。

将来的に環境変数が必要になった場合は `.env.example` を元に `.env.local` を作成してください。

---

## 開発

### 開発サーバー起動

```bash
bun run dev
```

起動後に以下へアクセスしてください。

```text
http://localhost:3000
```

### ビルド

```bash
bun run build
```

### 本番起動

```bash
bun run start
```

### 型チェック

```bash
bun run check
```

Biome と TypeScript のチェックをまとめて実行します。

### コード品質チェック

```bash
bun run lint
```

### 自動フォーマット

```bash
bun run format
```

### フォーマット確認

```bash
bun run format:check
```

---

## 技術スタック

| カテゴリ       | ツール          | バージョン   |
| ---------- | ------------ | ------- |
| フレームワーク    | Next.js      | ^15.3.3 |
| ランタイム      | React        | ^19.1.0 |
| 言語         | TypeScript   | ^5.8.3  |
| スタイリング     | Tailwind CSS | ^4.1.8  |
| UI コンポーネント | shadcn/ui    | package.json 参照 |
| アイコン       | Lucide React | ^0.525.0 |
| コード品質      | Biome        | ^2.1.3  |
| モック        | MSW          | ^2.9.1  |
| パッケージマネージャ | Bun          | packageManager 参照 |

---

## ディレクトリ構成

```text
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

### ディレクトリ方針

| ディレクトリ              | 役割                    |
| ------------------- | --------------------- |
| `src/app`           | App Router のページとレイアウト |
| `src/components`    | Atomic Design ベースの UI |
| `src/components/ui` | shadcn/ui コンポーネント     |
| `src/services`      | API 通信処理              |
| `src/hooks`         | カスタムフック               |
| `src/types`         | 型定義                   |
| `src/utils`         | 共通ユーティリティ             |
| `src/constants`     | 定数管理                  |
| `src/mocks`         | MSW の設定・モック API       |
| `src/styles`        | グローバルスタイル             |

---

## MSW(Mock Service Worker)

本プロジェクトでは、バックエンド API が未完成の段階でもフロントエンド開発を進められるように MSW を利用しています。

### MSW を利用する目的

* API 未実装でも画面開発が可能
* ローディング状態の確認
* エラー状態の確認
* フロントエンド単体での動作確認

### 関連ファイル

```text
src/mocks/
├── browser.ts
├── server.ts
├── MSWProvider.tsx
└── handlers/
    ├── index.ts
    └── user.ts
```

### Service Worker 初期化

初回のみ実行してください。

```bash
bun run msw:init
```

以下のファイルを生成します。

```text
public/mockServiceWorker.js
```

開発環境でのみ有効になるよう設定されています。

---

## よく使うコマンド

| コマンド                   | 説明         |
| ---------------------- | ---------- |
| `bun run dev`          | 開発サーバ起動    |
| `bun run build`        | 本番ビルド      |
| `bun run start`        | 本番起動       |
| `bun run check`        | 型チェック      |
| `bun run lint`         | Biome チェック |
| `bun run lint:fix`         | Biome 自動変更 |
| `bun run format`       | 自動整形       |
| `bun run format:check` | フォーマット確認   |
| `bun run msw:init`     | MSW 初期化    |

---

## ドキュメント

今後、プロジェクトの成長に合わせて以下のドキュメントを追加予定です。

* DEVELOPMENT.md
* GIT_WORKFLOW.md
* CI_CD.md
* TROUBLESHOOTING.md

---

## 関連リンク

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Biome
* MSW
* Bun

---

## ライセンス

このプロジェクトはプライベートリポジトリです。
