import { APP_NAME } from "@/constants/config";

// サイト共通の主要ナビゲーション
// 見出しやボタンは変更理由が異なるため、ここでは管理しない。
export const NAVIGATION_LABELS = {
  ABOUT: `${APP_NAME}とは`,
  EVENT_LIST: "イベントを探す",
  ORGANIZER: "主催者の方へ",
} as const;
