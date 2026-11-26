import { AppLayout } from "@/components/layouts/AppLayout";
import {
  APP_DESCRIPTION,
  APP_NAME,
  SITE_URL,
  THEME_COLOR,
} from "@/constants/config";
import { MSWProvider } from "@/mocks/MSWProvider";
import { SITE_OPEN_GRAPH } from "@/utils/metadata";
import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
};

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
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // nonce を使う CSP（#383 / #413）では HTML に nonce を埋め込む必要があるため、
  // 全ページを動的レンダリングにする。layout で connection() を呼ぶと配下の
  // 全セグメントの prerender が止まり、毎リクエスト描画になる。
  // OpenNext の incremental cache は既定の dummy で unstable_cache は実際には
  // キャッシュせず、event/[id] のデータも毎リクエスト取り直す
  // （event/[id]/page.tsx・docs/Deployment.md「イベント詳細の SSR / メタデータ」）。
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
