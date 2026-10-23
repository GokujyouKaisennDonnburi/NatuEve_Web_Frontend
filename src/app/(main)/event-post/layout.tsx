import { PAGE_TITLES } from "@/constants/pageTitles";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: PAGE_TITLES.EVENT_POST,
};

export default function EventPostLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
