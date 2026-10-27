import { APP_NAME } from "@/constants/config";

// サイト共通の主要ナビゲーション。見出しやアクション文言とは混用しない。
export const NAVIGATION_LABELS = {
  ABOUT: `${APP_NAME}とは`,
  EVENT_LIST: "イベントを探す",
  ORGANIZER: "主催者の方へ",
} as const;

export const BACK_LINK_LABELS = {
  EVENT_LIST: "イベント一覧にもどる",
  EVENT_DETAIL: "イベント詳細にもどる",
} as const;
