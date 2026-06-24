import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";

export function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div>{children}</div>;
}
