import { PAGE_TITLES } from "@/constants/pageTitles";
import type { Metadata } from "next";
import type { ReactNode } from "react";

// 確認トークン付きの URL のため、検索エンジンには登録させない。
// 確定トークンが Referer 経由で外部へ漏れないよう、リファラー送信も抑制する。
export const metadata: Metadata = {
  title: PAGE_TITLES.EVENT_JOIN_CONFIRM,
  robots: { index: false, follow: false },
  other: { referrer: "no-referrer" },
};

export default function EventJoinConfirmLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
