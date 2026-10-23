import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "主催者の方へ",
};

export default function ComingSoonLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
