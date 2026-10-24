import { APP_NAME } from "@/constants/config";

// Next.js の metadata.title 専用。画面内の文言は labels.ts で管理する。
export const PAGE_TITLES = {
  ABOUT: `${APP_NAME}とは`,
  AUTH_CALLBACK: "サインイン処理中",
  COMING_SOON: "主催者の方へ",
  DOCS: "ドキュメント",
  EVENT_DETAIL: "イベント詳細",
  EVENT_LIST: "イベントを探す",
  EVENT_POST: "イベントを投稿",
  GUIDELINE: "投稿ガイドライン",
  MYPAGE: "マイページ",
  REPORT_POST: "活動レポートを投稿",
  SIGNIN: "サインイン",
  USER_PROFILE: "プロフィール",
} as const;
