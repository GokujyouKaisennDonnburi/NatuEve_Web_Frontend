import { APP_NAME } from "@/constants/config";

// Next.js の metadata.title 専用。変更理由が異なる画面内の文言とは混用しない。
export const PAGE_TITLES = {
  // イベント関連
  EVENT_LIST: "イベントを探す",
  EVENT_DETAIL: "イベント詳細",
  EVENT_POST: "イベントを投稿",
  REPORT_POST: "活動レポートを投稿",

  // サービス案内
  ABOUT: `${APP_NAME}とは`,
  COMING_SOON: "主催者の方へ",
  GUIDELINE: "投稿ガイドライン",
  DOCS: "ドキュメント",

  // ユーザー・認証関連
  MYPAGE: "マイページ",
  USER_PROFILE: "プロフィール",
  SIGNIN: "サインイン",
  AUTH_CALLBACK: "サインイン処理中",
} as const;
