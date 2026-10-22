import { AppLayout } from "@/components/layouts/AppLayout";
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

export const metadata: Metadata = {
  title: "なちゅいべ",
  description: "なちゅいべは、自然を楽しむイベントを「探したい人」と「開催したい人」をつなぐサービスです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
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
