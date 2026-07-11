# イベント投稿APIのtagIds対応

## 概要

イベント作成API（`POST /api/v1/events`）のリクエストボディが変更され、`tags`（タグ名の文字列配列）から`tagIds`（タグUUIDの配列）に変わった。これに伴い、フロントエンドの型定義、フォーム状態管理、ペイロード構築、MSWモックハンドラを修正する。

## 変更内容

### 1. 型定義の修正

**`src/types/event.ts`**

- `CreateEventRequest` の `tags?: string[]` を `tagIds?: string[]` に変更
- コメントも合わせて更新（タグUUIDの配列であることを明記）

**`src/types/tag.ts`**（新規）

- `TagItem` 型を追加（`id: string` + `name: string`）。タグ入力欄で選択済みタグを保持するための型。

### 2. フォーム状態の変更

**`src/app/event-post/page.tsx`**

- `EventPostFormState.tags` の型を `string[]` → `TagItem[]` に変更
- `INITIAL_STATE.tags` を `[]` のまま（`TagItem[]` として初期化）
- `validate()` 内のタグ検証ロジックを `TagItem[]` に対応させる（`tag.name` を参照するよう変更）
- `handleSubmit()` 内のペイロード構築を以下に変更

```typescript
// Before
if (formState.tags.length > 0) {
  payload.tags = formState.tags.map((tag) => tag.trim());
}

// After
if (formState.tags.length > 0) {
  payload.tagIds = formState.tags.map((tag) => tag.id);
}
```

### 3. TagInputField の修正

**`src/components/molecules/event-post/TagInputField.tsx`**

- Props `tags: string[]` を `tags: TagItem[]` に変更
- Props `onTagsChange: (tags: string[]) => void` を `onTagsChange: (tags: TagItem[]) => void` に変更
- `handleAdd()` 内で `useCreateTag().submit()` のレスポンス `{ id, name }` の両方を保持するよう変更
- 既存タグチップの削除処理は `TagItem[]` のフィルターに変更
- 重複判定は `tags.some(t => t.name === trimmedDraft)` に変更
- `tag.name` を `TagChip` の `label` に渡す

### 4. MSW モックハンドラの修正

**`src/mocks/handlers/events.ts`**

- `POST /api/v1/events` ハンドラ内のリクエストボディ型に `tagIds?: unknown` を追加
- タグバリデーションを `body.tags`（string[]）から `body.tagIds`（UUID[]）に変更
  - 配列チェック・各要素が文字列であること・UUID形式の簡易チェック・最大件数
- モックイベント詳細の `tags` フィールドには、受け取った `tagIds` をそのまま格納（表示用。本番ではGET時にタグ名が返却される想定）

### 5. インポートの追加

**`src/app/event-post/page.tsx`**

- `TagItem` 型を `@/types/tag` からインポート

**`src/components/molecules/event-post/TagInputField.tsx`**

- `TagItem` 型を `@/types/tag` からインポート（`TagError`, `TagErrorCode` のインポート行に追加）

## 影響範囲

| ファイル | 変更内容 |
|---|---|
| `src/types/event.ts` | `CreateEventRequest.tags` → `tagIds` |
| `src/types/tag.ts` | `TagItem` 型を追加 |
| `src/app/event-post/page.tsx` | フォーム状態・バリデーション・ペイロード構築を修正 |
| `src/components/molecules/event-post/TagInputField.tsx` | Props・内部処理を `TagItem[]` 対応に変更 |
| `src/mocks/handlers/events.ts` | リクエストバリデーションを `tagIds` に変更 |

## 影響がないもの

- `EventDetailResponse.tags`（GETレスポンスの表示用フィールド）は変更なし
- `EventTagList.tsx`（表示のみ）は変更なし
- `EventCard.tsx`（表示のみ）は変更なし
- `services/tag.ts`（タグ作成API）は変更なし
- `hooks/useCreateTag.ts`（タグ作成フック）は変更なし
- `mocks/handlers/tags.ts`（タグ作成モック）は変更なし

## 確認手順

1. `bun run dev` で開発サーバーを起動
2. イベント投稿ページ（`/event-post`）でタグを入力・追加できること
3. タグを追加した状態でイベントを作成し、成功すること
4. MSW のモックが `tagIds` を正しく検証し、作成されたイベント詳細にタグが表示されること
5. `bun run lint` でリントエラーがないこと
6. `bun run typecheck` で型エラーがないこと