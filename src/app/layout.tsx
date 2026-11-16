import { AppLayout } from "@/components/layouts/AppLayout";
import { APP_DESCRIPTION, APP_NAME, SITE_URL } from "@/constants/config";
import { MSWProvider } from "@/mocks/MSWProvider";
import { SITE_OPEN_GRAPH } from "@/utils/metadata";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: SITE_OPEN_GRAPH,
  // title・description・画像は openGraph と metadata から引き継がれる。
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MSWProvider>
          <AppLayout>{children}</AppLayout>
        </MSWProvider>
      </body>
    </html>
  );
}
