import { EVENT_SEARCH_DESCRIPTION } from "@/constants/config";
import { PAGE_TITLES } from "@/constants/pageTitles";
import { ROUTES } from "@/constants/routes";
import { canonicalMetadata } from "@/utils/metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: PAGE_TITLES.EVENT_LIST,
  description: `${EVENT_SEARCH_DESCRIPTION}を地域やタグから探せます。`,
  ...canonicalMetadata(ROUTES.EVENT_LIST),
};

export default function EventListLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
