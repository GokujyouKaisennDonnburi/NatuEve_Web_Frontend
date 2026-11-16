import { PAGE_TITLES } from "@/constants/pageTitles";
import { ROUTES } from "@/constants/routes";
import { canonicalMetadata } from "@/utils/metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: PAGE_TITLES.GUIDELINE,
  ...canonicalMetadata(ROUTES.GUIDELINE),
};

export default function GuidelineLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
