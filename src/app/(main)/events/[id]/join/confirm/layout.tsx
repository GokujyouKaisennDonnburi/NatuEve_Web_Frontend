import { PAGE_TITLES } from "@/constants/pageTitles";
import type { Metadata } from "next";
import type { ReactNode } from "react";

// 確認トークン付きの URL のため、検索エンジンには登録させない。
export const metadata: Metadata = {
  title: PAGE_TITLES.EVENT_JOIN_CONFIRM,
  robots: { index: false, follow: false },
};

export default function EventJoinConfirmLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
