import { PAGE_TITLES } from "@/constants/pageTitles";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: PAGE_TITLES.SIGNIN,
  alternates: {
    canonical: "/signin",
  },
};

export default function SignInLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
