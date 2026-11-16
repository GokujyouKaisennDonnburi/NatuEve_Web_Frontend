import { PAGE_TITLES } from "@/constants/pageTitles";
import { canonicalMetadata } from "@/utils/metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>): Promise<Metadata> {
  const { id } = await params;
  return {
    title: PAGE_TITLES.EVENT_DETAIL,
    ...canonicalMetadata(`/event/${encodeURIComponent(id)}`),
  };
}

export default function EventDetailLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
