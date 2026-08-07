"use client";

import { Check, X } from "lucide-react";
import { toast } from "sonner";

type CompletionToastProps = {
  message: string;
  onClose: () => void;
};

// 操作が完了したことを知らせる汎用トースト。
// 画面下中央に濃色のピルで表示する。
// 表示は showCompletionToast 経由で行い、直接描画するのは Storybook などの確認用途を想定する。
export function CompletionToast({
  message,
  onClose,
}: Readonly<CompletionToastProps>) {
  return (
    // 幅は文言に合わせて伸縮させ、sonner のコンテナ内で中央に置く
    <div className="mx-auto flex min-h-[50px] w-fit max-w-full items-center gap-3 rounded-full bg-(--toast-dark) px-4 py-2 shadow-lg">
      {/* 丸は文字の行の高さ（20px）より少しだけ大きくする */}
      <span
        aria-hidden="true"
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-(--toast-accent) text-(--toast-check)"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <p className="text-sm font-bold text-white">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="閉じる"
        className="ml-1 inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// 完了トーストを表示する。呼び出し側は文言だけを渡す。
// 重なり順・自動クローズ・読み上げ（role="status"）は sonner に任せ、
// このトーストだけ位置を下中央にして、他のトースト（エラーなど）の表示位置は変えない。
export function showCompletionToast(message: string) {
  toast.custom(
    (id) => (
      <CompletionToast message={message} onClose={() => toast.dismiss(id)} />
    ),
    {
      // sonner の既定の枠を描かせず、ピルだけを表示する
      unstyled: true,
      position: "bottom-center",
      duration: 4000,
    },
  );
}
