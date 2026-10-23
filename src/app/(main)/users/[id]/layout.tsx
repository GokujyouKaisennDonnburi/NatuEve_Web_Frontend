import { PAGE_TITLES } from "@/constants/pageTitles";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: PAGE_TITLES.USER_PROFILE,
};

export default function UserProfileLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
