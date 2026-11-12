export const APP_NAME = "なちゅいべ";
// 検索されやすい語を含めた説明文の共通部分（#398）。APP_DESCRIPTION とイベント一覧の description で共有する。
export const EVENT_SEARCH_DESCRIPTION =
  "生き物観察会や自然観察、生態系の保全活動など、自然や生物に関わるイベント";

export const APP_DESCRIPTION = `なちゅいべは、${EVENT_SEARCH_DESCRIPTION}を「探したい人」と「開催したい人」をつなぐイベントサイトです。`;

// サイトの公開 URL。metadataBase に使う。
// 検証環境でも本番の URL を出す（canonical を本番に寄せるため）。
export const SITE_URL = "https://natueve-web.natuportal.org";

// 既定の OGP 画像。
export const DEFAULT_OG_IMAGE = {
  url: "/images/og-default.png",
  width: 1200,
  height: 630,
  alt: APP_NAME,
};

export const API_BASE_URL = "/api";

// イベント投稿画面のタグ入力欄の上限値。
// バックエンド(MSW)のサーバー側バリデーションと一致させる。
export const MAX_TAG_COUNT = 10;
export const MAX_TAG_LENGTH = 30;

// テキスト入力の共通上限。バックエンドの255文字制限に合わせる。
export const MAX_TEXT_LENGTH = 255;

// 1イベントに添付できるPDFの上限。
export const MAX_EVENT_PDF_COUNT = 3;

// 1回の参加申し込みで入力できる合計人数の上限。
// モーダルの入力制限・バックエンド(MSW)・API側のバリデーションで共通に使う。
export const MAX_PARTICIPATION_PARTY_SIZE = 10;

// 「期限間近」と判定する申込期限までの残り日数（判定は applicationDeadline 基準）。
export const DAYS_BEFORE_DEADLINE = 7;

// ページ内で「今見ている所」とみなす画面上部の帯。
// 上端は画面上端からの距離（px。固定ヘッダーに隠れる部分を除くための値）、下端は画面の上からの割合（%）。
// 目次（PageToc）のハイライトと、投稿画面（イベント・レポート）の入力→プレビュー切替の位置合わせで
// 同じ判定にそろえる。
export const CURRENT_SECTION_BAND_TOP_PX = 96;
export const CURRENT_SECTION_BAND_BOTTOM_PERCENT = 30;

// イベント一覧の絞り込み欄をサイドバーとして表示する条件。
// 16:9 やそれに近い横長比率(4:3 以上)かつ幅 640px 以上でデスクトップ扱いとし、
// 縦長だけでなく幅の狭い横長ビューポートでもドロワー表示にする。
// globals.css の desktop カスタムバリアントと同一の値のため、変更時は必ず同期する。
export const DESKTOP_MEDIA_QUERY =
  "(min-aspect-ratio: 4/3) and (min-width: 640px)";
