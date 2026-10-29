import { PAGE_TITLES } from "@/constants/pageTitles";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: PAGE_TITLES.EVENT_LIST,
  // 検索・絞り込みのクエリ付き URL も /event-list に寄せる（#374）
  alternates: {
    canonical: "/event-list",
  },
};

export default function EventListLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
