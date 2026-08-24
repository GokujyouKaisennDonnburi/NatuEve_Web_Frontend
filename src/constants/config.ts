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

// 「期限間近」と判定する開催日までの残り日数。
export const DAYS_BEFORE_DEADLINE = 7;
