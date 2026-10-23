import { APP_NAME } from "@/constants/config";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: `${APP_NAME}とは`,
};

export default function AboutLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
