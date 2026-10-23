import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "イベント詳細",
};

export default function EventDetailLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
