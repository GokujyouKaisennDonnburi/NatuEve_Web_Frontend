import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";

// アプリケーション全体のレイアウトを提供するコンポーネント
export function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div>
      {children}
      <Toaster richColors position="top-right" />
    </div>
  );
}
