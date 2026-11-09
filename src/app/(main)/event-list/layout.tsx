import { PAGE_TITLES } from "@/constants/pageTitles";
import { ROUTES } from "@/constants/routes";
import { canonicalMetadata } from "@/utils/metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: PAGE_TITLES.EVENT_LIST,
  description:
    "生き物観察会や自然観察、生態系の保全活動など、自然や生物に関わるイベントを地域やタグから探せます。",
  ...canonicalMetadata(ROUTES.EVENT_LIST),
};

export default function EventListLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
