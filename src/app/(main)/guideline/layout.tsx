import { PAGE_TITLES } from "@/constants/pageTitles";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: PAGE_TITLES.GUIDELINE,
  alternates: {
    canonical: "/guideline",
  },
};

export default function GuidelineLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
