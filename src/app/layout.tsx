import { AppLayout } from "@/components/layouts/AppLayout";
import { APP_DESCRIPTION, APP_NAME } from "@/constants/config";
import { MSWProvider } from "@/mocks/MSWProvider";
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

// 本番サイトの URL。local 等の環境では NEXT_PUBLIC_SITE_URL で差し替える（#374）。
// metadataBase を固定して絶対 URL から相対パスを解決できるようにする。
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://natueve-web.natuportal.org";

const SHARE_IMAGE = "/images/og-default.png";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: APP_NAME,
    locale: "ja_JP",
    type: "website",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [
      {
        url: SHARE_IMAGE,
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
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
