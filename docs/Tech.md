# 環境構築手順書

このドキュメントは、GitHub からクローンして初めて参加する開発者が、Windows 環境と VSCode を前提に、Bun を使って Next.js アプリをローカル起動できるようになるまでの手順をまとめたものです。

## 1. プロジェクト概要

NatuIve Web Frontend は、Next.js 15 / React 19 / TypeScript 5 を土台にしたフロントエンドのスターター構成です。
Atomic Design、services、hooks、types、utils、constants、mocks を分けて、初心者でも役割を追いやすいように整理しています。

現在の構成では、ホーム画面、ドキュメント画面、ユーザー画面を持ち、MSW を使った開発用モック API も含めています。

---

## 2. 技術スタック

| カテゴリ | ツール | バージョン |
| --- | --- | --- |
| フレームワーク | Next.js | 15.3.3 |
| ランタイム | React | 19.1.0 |
| 言語 | TypeScript | 5.8.3 |
| スタイリング | Tailwind CSS | 4.1.8 |
| UI コンポーネント | shadcn/ui | - |
| アイコン | Lucide React | 0.525.0 |
| コード品質 | Biome | 2.1.3 |
| モック | MSW | 2.9.1 |
| パッケージマネージャ | Bun | 1.2.21 |
| 開発環境 | VSCode | 最新安定版推奨 |
| バージョン管理 | Git / GitHub | 最新安定版 |

---

## 3. 前提条件

以下のツールを事前にインストールしてください。

| ツール | 推奨バージョン | 用途 |
| --- | --- | --- |
| Git | 最新安定版 | リポジトリの取得と管理 |
| Node.js | 22 LTS | 開発用の補助環境として利用 |
| Bun | 1.2.21 以上 | 依存関係のインストールと各種実行 |

補足:

- このプロジェクトは Bun を前提にしています。
- Node.js は README 上でも 22 LTS を推奨しています。
- VSCode では、TypeScript と Biome の拡張機能を入れておくと作業しやすくなります。

---

## 4. リポジトリ取得

GitHub からクローンします。

```bash
git clone <repository-url>
cd <project-name>
```

---

## 5. 依存関係インストール

```bash
bun install
```

---

## 6. 環境変数設定

`.env.example` は存在しますが、現在は空です。
そのため、現時点では追加の環境変数設定は不要です。

今後 API 連携などで環境変数が必要になった場合は、`.env.example` を雛形として `.env.local` を作成してください。

---

## 7. 開発サーバ起動

```bash
bun run dev
```

起動後は次の URL で確認します。

- http://localhost:3000

---

## 8. ビルド確認

```bash
bun run build
```

---

## 9. 型チェック

```bash
bun run check
```

このコマンドは Biome のチェックと TypeScript の `tsc --noEmit` をまとめて実行します。

---

## 10. Biome

Biome は、コードの整形と静的チェックをまとめて行うためのツールです。
このプロジェクトでは、TypeScript/React の記述ゆれを減らし、チーム全体で読みやすいコードを保つ目的で使います。

実行コマンド:

```bash
bun run lint
bun run format
bun run format:check
```

- `bun run lint` はコード品質チェック用です。
- `bun run format` は自動整形用です。
- `bun run format:check` は整形差分の有無を確認するために使います。

---

## 11. MSW

MSW は Mock Service Worker の略で、開発中に API をモックするために使います。

このプロジェクトで MSW を導入している理由は次のとおりです。

- なぜ MSW を導入しているのか
	- 実際のバックエンドが未完成でも、フロントエンドの画面開発を進められるためです。
- 開発時のみ利用すること
	- `src/mocks/MSWProvider.tsx` で開発時だけ起動するように制御しています。
- API 未完成でも画面開発が可能になること
	- モックレスポンスを使って、一覧表示やエラー表示、ローディング表示の確認ができます。

関連ファイル:

- `src/mocks/browser.ts`
- `src/mocks/server.ts`
- `src/mocks/MSWProvider.tsx`
- `src/mocks/handlers/index.ts`
- `src/mocks/handlers/user.ts`

MSW 初期化コマンド:

```bash
bun run msw:init
```

これは `public/mockServiceWorker.js` を生成するためのコマンドです。

---

## 12. ディレクトリ構成

`src` 配下の現在の構成は次のとおりです。

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── docs/
│   │   └── page.tsx
│   └── users/
│       └── page.tsx
├── components/
│   ├── atoms/
│   │   ├── Badge.tsx
│   │   └── Loading.tsx
│   ├── layouts/
│   │   └── AppLayout.tsx
│   ├── molecules/
│   │   └── SearchBox.tsx
│   ├── organisms/
│   │   ├── Header.tsx
│   │   └── UserList.tsx
│   ├── templates/
│   │   └── MainTemplate.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── constants/
│   ├── config.ts
│   ├── messages.ts
│   └── routes.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useCalendar.ts
│   └── useUser.ts
├── lib/
│   └── utils.ts
├── mocks/
│   ├── browser.ts
│   ├── MSWProvider.tsx
│   ├── server.ts
│   └── handlers/
│       ├── index.ts
│       └── user.ts
├── services/
│   ├── auth.ts
│   ├── calendar.ts
│   └── user.ts
├── styles/
│   └── globals.css
├── types/
│   ├── calendar.ts
│   ├── common.ts
│   └── user.ts
└── utils/
		├── date.ts
		├── format.ts
		└── validation.ts
```

---

## 13. よく使うコマンド一覧

| コマンド | 説明 |
| --- | --- |
| `bun run dev` | 開発サーバ起動 |
| `bun run build` | 本番ビルド |
| `bun run start` | 本番起動 |
| `bun run check` | TypeScript チェック |
| `bun run lint` | Biome チェック |
| `bun run format` | 自動整形 |
| `bun run format:check` | フォーマット確認 |
| `bun run msw:init` | MSW 初期化 |

---
