"use client";

import { useEffect } from "react";

type EventDetailErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// イベント詳細の SSR やクライアント処理で、404 以外の予期しないエラーが起きたときの表示。
export default function EventDetailErrorPage({
  error,
  reset,
}: Readonly<EventDetailErrorPageProps>) {
  useEffect(() => {
    console.error("イベント詳細の表示に失敗しました", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <h1 className="text-lg font-bold text-slate-800">
        イベントを読み込めませんでした。
      </h1>
      <button
        type="button"
        onClick={reset}
        className="text-sm text-emerald-700 underline transition hover:opacity-80"
      >
        再読み込み
      </button>
    </div>
  );
}
