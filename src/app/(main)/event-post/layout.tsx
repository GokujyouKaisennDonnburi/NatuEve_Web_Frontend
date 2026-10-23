import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "イベントを投稿",
};

export default function EventPostLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
