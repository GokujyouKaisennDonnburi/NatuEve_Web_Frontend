import { PAGE_TITLES } from "@/constants/pageTitles";
import { ROUTES } from "@/constants/routes";
import { canonicalMetadata } from "@/utils/metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  // 「なちゅいべとは | なちゅいべ」の重複を避けるため absolute にする
  title: {
    absolute: PAGE_TITLES.ABOUT,
  },
  ...canonicalMetadata(ROUTES.ABOUT),
};

export default function AboutLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
