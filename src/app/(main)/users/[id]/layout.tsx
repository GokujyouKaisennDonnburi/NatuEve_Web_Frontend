import { PAGE_TITLES } from "@/constants/pageTitles";
import { ROUTES } from "@/constants/routes";
import { canonicalMetadata } from "@/utils/metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>): Promise<Metadata> {
  const { id } = await params;
  return {
    title: PAGE_TITLES.USER_PROFILE,
    // 個人のページのため検索に載せない。主催者名はイベント詳細ページの本文から検索される。
    robots: { index: false },
    ...canonicalMetadata(`${ROUTES.USERS}/${encodeURIComponent(id)}`),
  };
}

export default function UserProfileLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
