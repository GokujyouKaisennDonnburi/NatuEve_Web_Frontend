import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "投稿ガイドライン",
};

export default function GuidelineLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
