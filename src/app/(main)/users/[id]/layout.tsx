import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "プロフィール",
};

export default function UserProfileLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
