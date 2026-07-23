import { SiteFooter } from "@/components/layouts/SiteFooter";
import { SiteHeader } from "@/components/layouts/SiteHeader";
import type { ReactNode } from "react";

// /signin と /auth/callback を除く全ページに
// ヘッダー / フッターを共通適用するための Route Group レイアウト。
// 背景と最小限の padding のみ持ち、max-width は各ページ内で既存のまま維持する。
export default function MainLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60 text-slate-900 antialiased">
      <SiteHeader />
      <main className="flex-1 px-4 pt-4 pb-16">{children}</main>
      <SiteFooter />
    </div>
  );
}
