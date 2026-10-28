"use client";

import { ensureMockWorker, syncMockWorker } from "@/services/mockAuth";
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

    if (process.env.NEXT_PUBLIC_USE_MSW === "true") {
      // 失敗時の警告と再試行の抑制は ensureMockWorker が行う。
      void ensureMockWorker();
    } else {
      // 起動済みのモックワーカーを停止する。
      void syncMockWorker(false).catch(() => undefined);
    }
  }, []);

  return children;
}
