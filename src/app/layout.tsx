import { AppLayout } from "@/components/layouts/AppLayout";
import { APP_DESCRIPTION, APP_NAME, SITE_URL } from "@/constants/config";
import { MSWProvider } from "@/mocks/MSWProvider";
import { SITE_OPEN_GRAPH } from "@/utils/metadata";
import type { Metadata } from "next";
import { connection } from "next/server";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // nonce を使う CSP（#383 / #413）では HTML に nonce を埋め込む必要があるため、
  // 全ページを動的レンダリングにする。layout で connection() を呼ぶと配下の
  // 全セグメントの prerender が止まり、毎リクエスト描画になる。
  // event/[id] のデータ鮮度は unstable_cache（revalidate: 60）が担保する。
  await connection();

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
