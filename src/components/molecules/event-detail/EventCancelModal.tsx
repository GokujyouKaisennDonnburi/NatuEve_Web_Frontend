"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants/routes";
import { cancelEvent } from "@/services/event";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// イベント削除モーダルのプロパティ
type EventCancelModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  eventId: string;
  eventTitle: string;
  totalCount: number;
  totalMembers: number;
};

// イベント削除モーダル(物理的に削除しているわけではなく、中止状態にしているだけで存在はする)
export function EventCancelModal({
  isOpen,
  onOpenChange,
  eventId,
  eventTitle,
  totalCount,
  totalMembers,
}: Readonly<EventCancelModalProps>) {
  const router = useRouter();
  const hasMembers = totalCount > 0;

  // モーダルの状態管理
  const [isCancelling, setIsCancelling] = useState(false);
  const [notifySubject, setNotifySubject] = useState("");
  const [notifyBody, setNotifyBody] = useState("");

  // 削除可能かどうか
  const canCancel = hasMembers
    ? notifySubject.trim().length > 0 &&
      notifyBody.trim().length > 0 &&
      !isCancelling
    : !isCancelling;

  // モーダルを閉じる
  const handleClose = useCallback(() => {
    if (isCancelling) return;

    onOpenChange(false);
    setNotifySubject("");
    setNotifyBody("");
  }, [isCancelling, onOpenChange]);

  // イベント削除
  const handleCancel = () => {
    if (!canCancel) return;

    setIsCancelling(true);

    void (async () => {
      try {
        // キャンセルAPIは非冪等。
        // 参加者がいる場合は通知も同時に送信する。
        await cancelEvent(
          eventId,
          hasMembers
            ? {
                subject: notifySubject.trim(),
                body: notifyBody.trim(),
              }
            : {},
        );

        toast.success(
          hasMembers
            ? "イベントを削除し、参加者へ通知を送信しました。"
            : "イベントを削除しました。",
        );

        handleClose();
        router.push(ROUTES.EVENT_LIST);
      } catch (error) {
        console.error("イベントの削除に失敗しました:", error);

        toast.error(
          "イベントの削除に失敗しました。時間をおいて再度お試しください。",
        );
      } finally {
        setIsCancelling(false);
      }
    })();
  };

  // モーダル表示中は背景スクロールをロックし、Escapeで閉じる
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // モーダルが閉じている場合は何も表示しない
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 背景クリックで閉じる */}
      <button
        type="button"
        aria-label="イベント削除モーダルを閉じる"
        className="absolute inset-0 cursor-default bg-black/50"
        onClick={handleClose}
        tabIndex={-1}
      />

      <div
        className="relative w-full max-w-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`cancel-event-modal-title-${eventId}`}
      >
        <Card className="border-slate-200 bg-white shadow-xl">
          <CardContent className="space-y-5 px-8 py-2">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <Trash2 className="h-6 w-6" />
              </div>

              <div className="space-y-0.5">
                <h2
                  id={`cancel-event-modal-title-${eventId}`}
                  className="text-lg font-bold text-slate-900"
                >
                  イベントを削除しますか？
                </h2>

                <p className="text-sm text-slate-600">
                  「{eventTitle}」を削除します。
                  <br />
                  この操作は取り消せません。
                </p>
              </div>
            </div>

            {/* 参加者がいる場合のみ通知内容を入力 */}
            {hasMembers ? (
              <div className="space-y-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm leading-relaxed text-red-700">
                  すでに{" "}
                  <span className="font-bold">
                    {totalCount}組（{totalMembers}名）
                  </span>{" "}
                  の参加申込があります。
                  <br />
                  削除にあたって、参加者へお詫び・中止のご連絡を送ることをおすすめします。
                </p>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`cancel-notify-subject-${eventId}`}
                        className="text-sm font-semibold text-red-800"
                      >
                        連絡の件名
                      </Label>

                      <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                        必須
                      </span>
                    </div>

                    <Input
                      id={`cancel-notify-subject-${eventId}`}
                      type="text"
                      value={notifySubject}
                      onChange={(e) => setNotifySubject(e.target.value)}
                      placeholder="例:【中止のお知らせ】夜の湿原ホタル観察会"
                      disabled={isCancelling}
                      maxLength={255}
                      className="h-11 rounded-xl border-red-200 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`cancel-notify-body-${eventId}`}
                        className="text-sm font-semibold text-red-800"
                      >
                        連絡本文
                      </Label>

                      <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                        必須
                      </span>
                    </div>

                    <Textarea
                      id={`cancel-notify-body-${eventId}`}
                      value={notifyBody}
                      onChange={(e) => setNotifyBody(e.target.value)}
                      placeholder="参加者へのお詫び・中止理由などを入力してください"
                      disabled={isCancelling}
                      rows={4}
                      className="field-sizing-fixed h-32 resize-none overflow-y-auto rounded-xl border-red-200 bg-white"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* ボタン */}
            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                disabled={!canCancel}
                onClick={handleCancel}
                className="h-11 rounded-full bg-red-500 px-8 font-semibold text-white hover:bg-red-600 disabled:bg-red-300 disabled:text-white"
              >
                {isCancelling ? "送信中…" : "連絡して削除"}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isCancelling}
                onClick={handleClose}
                className="h-11 rounded-full border-slate-300 px-8 font-semibold text-slate-700"
              >
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EventCancelModal;
