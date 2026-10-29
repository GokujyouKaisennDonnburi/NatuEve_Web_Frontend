import { PAGE_TITLES } from "@/constants/pageTitles";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: PAGE_TITLES.DOCS,
  alternates: {
    canonical: "/docs",
  },
};

export default function DocsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
