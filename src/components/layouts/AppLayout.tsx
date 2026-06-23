import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";

export function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col gap-8 border border-white/60 bg-white/40 p-4 shadow-2xl shadow-slate-200/50 backdrop-blur-xl sm:p-6 lg:p-8">
        {children}
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
