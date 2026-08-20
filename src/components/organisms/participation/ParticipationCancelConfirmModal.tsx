"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollLock } from "@/hooks/useScrollLock";
import { TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useId, useRef } from "react";

type ParticipationCancelConfirmModalProps = {
  isOpen: boolean;
  // イベント名。本文に埋め込む
  eventTitle: string;
  // 取り消し送信中かどうか。true の間は閉じさせない
  isSubmitting: boolean;
  // 「取り消す」押下時に呼ぶ
  onConfirm: () => void;
  // 「やめる」「背景」「Escape」で呼ぶ
  onClose: () => void;
};

// 申込取り消しの最終確認モーダル。
//
// 申し込み内容モーダルの上に重ねて表示するため、z-50 の申し込み内容モーダルより
// 手前に来るよう z-[60] を使う。
export function ParticipationCancelConfirmModal({
  isOpen,
  eventTitle,
  isSubmitting,
  onConfirm,
  onClose,
}: Readonly<ParticipationCancelConfirmModalProps>) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // 送信中は閉じさせない。API の結果を受け取る前に確認画面が消えるのを防ぐ。
  const handleClose = useCallback(() => {
    if (isSubmitting) return;

    onClose();
  }, [isSubmitting, onClose]);

  // モーダル表示中は背景スクロールをロックする
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    dialogRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // モーダルが閉じている場合は何も表示しない
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex h-screen items-center justify-center px-4">
      {/* 背景クリックで閉じる */}
      <button
        type="button"
        aria-label="申し込み取り消し確認を閉じる"
        className="absolute inset-0 cursor-default bg-black/50"
        onClick={handleClose}
        tabIndex={-1}
      />

      <div
        ref={dialogRef}
        // 開いた直後にフォーカスを受け取るためだけの tabIndex。
        // Tab の巡回順には入れず、プログラム側からのみフォーカスする。
        tabIndex={-1}
        className="relative w-full max-w-md outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <Card className="border-slate-200 bg-white shadow-xl">
          <CardContent className="space-y-5 px-8 py-2">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--danger-soft) text-(--danger)">
                <TriangleAlert className="h-6 w-6" />
              </div>

              <div className="space-y-0.5">
                <h2 id={titleId} className="text-lg font-bold text-slate-900">
                  申し込みを取り消しますか？
                </h2>
                <p className="text-sm text-slate-600">
                  「{eventTitle}」の申込を取り消します。
                  <br />
                  この操作は取り消せません。
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={onConfirm}
                className="h-11 rounded-full bg-(--danger) px-8 font-semibold text-white hover:bg-(--danger-hover) disabled:opacity-60"
              >
                {isSubmitting ? "送信中…" : "取り消す"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleClose}
                className="h-11 rounded-full border-slate-300 px-8 font-semibold text-slate-700"
              >
                やめる
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
