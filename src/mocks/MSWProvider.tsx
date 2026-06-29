"use client";

import { syncMockWorker } from "@/services/mockAuth";
import { useEffect } from "react";

type MSWProviderProps = {
  children: React.ReactNode;
};

export function MSWProvider({ children }: Readonly<MSWProviderProps>) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    void syncMockWorker(process.env.NEXT_PUBLIC_USE_MSW === "true").catch(
      () => undefined,
    );
  }, []);

  return children;
}
