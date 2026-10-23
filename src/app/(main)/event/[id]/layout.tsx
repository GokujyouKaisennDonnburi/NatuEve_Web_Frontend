import { PAGE_TITLES } from "@/constants/pageTitles";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: PAGE_TITLES.EVENT_DETAIL,
};

export default function EventDetailLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
