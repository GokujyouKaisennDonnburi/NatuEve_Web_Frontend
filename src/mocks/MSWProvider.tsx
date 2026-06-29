"use client";

import { syncMockWorker } from "@/services/mockAuth";
import { useEffect } from "react";

type MSWProviderProps = {
  children: React.ReactNode;
};

// 開発環境でのみモックワーカーを同期するためのコンポーネント
export function MSWProvider({ children }: Readonly<MSWProviderProps>) {
  useEffect(() => {
    // 開発環境以外ではモックワーカーを同期しない
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    // モックワーカーを同期する。失敗しても無視する。
    void syncMockWorker(process.env.NEXT_PUBLIC_USE_MSW === "true").catch(
      () => undefined,
    );
  }, []);

  return children;
}
