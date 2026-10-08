export const APP_NAME = "NatuEve Web Frontend";
export const APP_DESCRIPTION =
  "Next.js 15, React 19, Tailwind CSS 4, Biome 2, MSW 2 の starter kit";
export const API_BASE_URL = "/api";

// イベント投稿画面のタグ入力欄の上限値。
// バックエンド(MSW)のサーバー側バリデーションと一致させる。
export const MAX_TAG_COUNT = 10;
export const MAX_TAG_LENGTH = 30;

// テキスト入力の共通上限。バックエンドの255文字制限に合わせる。
export const MAX_TEXT_LENGTH = 255;

// 1イベントに添付できるPDFの上限。
export const MAX_EVENT_PDF_COUNT = 3;

// 「期限間近」と判定する申込期限までの残り日数（判定は applicationDeadline 基準）。
export const DAYS_BEFORE_DEADLINE = 7;

// イベント一覧の絞り込み欄をサイドバーとして表示する画面比率の閾値。
// 16:9 やそれに近い横長比率でデスクトップ扱いとし、縦長ではドロワー表示にする。
// globals.css の desktop カスタムバリアントと同一の値のため、変更時は必ず同期する。
export const DESKTOP_MEDIA_QUERY = "(min-aspect-ratio: 4/3)";
