import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "サインイン処理中",
};

export default function AuthCallbackLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
