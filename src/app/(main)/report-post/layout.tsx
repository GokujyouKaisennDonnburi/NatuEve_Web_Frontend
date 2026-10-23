import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "活動レポートを投稿",
};

export default function ReportPostLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
