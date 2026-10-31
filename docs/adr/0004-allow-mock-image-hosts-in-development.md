# ADR-0004: 開発環境ではモック用の画像取得元を許可する

- ステータス: Accepted
- 日付: 2026-10-28
- 関連: #367, ADR-0002, ADR-0003

## コンテキストと課題

MSW のモックデータは、イベント画像に `picsum.photos`、アバターに `i.pravatar.cc` を使う。
アバターは `next/image` の `unoptimized` で表示するため、画像最適化の許可リストには含めない。
開発サーバの起動後に `.env.local` の `NEXT_PUBLIC_USE_MSW` を `true` にしても、
`next.config.ts` は再評価されないため、`images.remotePatterns` にモック用の取得元が入らず、
`next/image` がホスト未設定エラーになる。

また、`next dev` は既定で `0.0.0.0` にバインドする。開発サーバへ LAN やトンネル経由で到達できる場合、
`pathname` を制限しない許可リストは、`/_next/image` を任意の picsum URL の変換に使われるおそれがある。

ADR-0003 の決定 4 は、`next.config.ts` のビルド時分岐を `NEXT_PUBLIC_USE_MSW` と開発用 R2 のフラグに限定している。
本 ADR は、デプロイ対象外の開発環境に限った例外を追加する。

## 決定

開発環境（`NODE_ENV=development`）では、`NEXT_PUBLIC_USE_MSW` の値に関係なく、
`images.remotePatterns` にモック用の取得元を含める。
ただし、開発サーバの画像最適化を任意 URL の変換に使われないよう、`pathname` を実際のモック URL の形式に限定する。

- `picsum.photos`: `/+([0-9])/+([0-9])`

アバター（`i.pravatar.cc`）は `next/image` の `unoptimized` で表示するため、許可リストに含めない。
本番・検証ビルドは従来どおり `NEXT_PUBLIC_USE_MSW=true` のときだけ許可し、
CI では `NEXT_PUBLIC_USE_MSW=false` を固定する。
開発サーバを LAN に公開しない場合は、`bun run dev -- -H 127.0.0.1` で起動する。

## 理由

- 開発サーバは起動後の `.env.local` 変更で `next.config.ts` を再評価しないため、
  フラグだけに依存すると、MSW を有効にした直後に画像エラーが残る。
- `NODE_ENV=development` に限定するため、本番・検証ビルドの許可リストには影響しない。
- `pathname` 制限とバインド先の注意により、開発サーバ経由の画像変換の悪用範囲を狭められる。
- ADR-0003 の決定 4 を書き換えず、開発環境の例外を新しい決定として記録できる。

## 影響（結果）

### 良い影響

- 開発サーバの起動後に `NEXT_PUBLIC_USE_MSW` を変更しても、イベント・レポート画像が `next/image` で表示できる。
- 本番・検証ビルドの画像取得元は変わらない。
- `pathname` 制限により、開発サーバが到達可能な状況でも任意パスの画像変換を防げる。

### トレードオフ・注意

- モック画像のホスト・パス・サイズを変えるときは、`next.config.ts` と `src/__tests__/nextConfigImageHosts.test.ts` を更新する。
- アバターを `unoptimized` から外して最適化する場合は、`i.pravatar.cc` を許可リストとテストに追加する。
- `picsum.photos` は任意の数値サイズを許可するため、さらに厳密にする場合は `/1200/600` と `/600/400` のような実際のパスに限定する。
- 開発サーバを `0.0.0.0` で公開すると、許可したパスの範囲でも画像変換を悪用されうる。LAN に公開しない場合は `-H 127.0.0.1` を使う。
- `NEXT_PUBLIC_USE_MSW=true` でビルドした環境は、引き続き公開しない（ADR-0002・ADR-0003）。

## 検討した代替案

- **`NEXT_PUBLIC_USE_MSW=true` のときだけ許可し、`.env.local` 変更時は再起動を必須にする**: 開発サーバの再起動漏れで同じ画像エラーが再発するため、不採用。
- **開発環境用の新しいフラグを追加する**: 設定が増え、ADR-0003 のビルド時分岐の制約とも整合しにくいため、不採用。
- **`pathname` を制限せずに開発環境で常時許可する**: 開発サーバが到達可能な場合に任意画像の変換を許すため、不採用。
