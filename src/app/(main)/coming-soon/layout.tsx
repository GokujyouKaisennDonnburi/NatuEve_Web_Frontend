import { PAGE_TITLES } from "@/constants/pageTitles";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: PAGE_TITLES.COMING_SOON,
  robots: { index: false },
};

export default function ComingSoonLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
