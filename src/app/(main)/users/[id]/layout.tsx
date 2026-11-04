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
    ...canonicalMetadata(`${ROUTES.USERS}/${id}`),
  };
}

export default function UserProfileLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
