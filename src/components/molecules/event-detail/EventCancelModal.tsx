"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants/routes";
import { cancelEvent } from "@/services/event";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// イベント削除モーダルのプロパティ
type EventCancelModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  eventId: string;
  hasMembers: boolean;
};

// イベント削除モーダル(物理的に削除しているわけではなく、中止状態にしているだけで存在はする)
export function EventCancelModal({
  isOpen,
  onOpenChange,
  eventId,
  hasMembers,
}: Readonly<EventCancelModalProps>) {
  const router = useRouter();

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
        className="relative w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`cancel-event-modal-title-${eventId}`}
      >
        <Card className="border-slate-200/80 bg-white/95 shadow-xl backdrop-blur">
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-1">
              <h2
                id={`cancel-event-modal-title-${eventId}`}
                className="text-lg font-bold text-slate-900"
              >
                イベントを削除しますか？
              </h2>

              <p className="text-sm text-slate-600">
                この操作は取り消せません。
                <br />
                {hasMembers
                  ? "イベントを削除し、参加者へ中止通知を送信した上でイベント一覧へ移動します。"
                  : "イベントを削除し、イベント一覧へ移動します。"}
              </p>
            </div>

            {/* 参加者がいる場合のみ通知内容を入力 */}
            {hasMembers ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`cancel-notify-subject-${eventId}`}>
                    件名
                    <span className="ml-1 text-red-600">(必須)</span>
                  </Label>

                  <Input
                    id={`cancel-notify-subject-${eventId}`}
                    type="text"
                    value={notifySubject}
                    onChange={(e) => setNotifySubject(e.target.value)}
                    placeholder="例:【重要】イベント開催中止のお知らせ"
                    disabled={isCancelling}
                    maxLength={255}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`cancel-notify-body-${eventId}`}>
                    本文
                    <span className="ml-1 text-red-600">(必須)</span>
                  </Label>

                  <Textarea
                    id={`cancel-notify-body-${eventId}`}
                    value={notifyBody}
                    onChange={(e) => setNotifyBody(e.target.value)}
                    placeholder="例:台風接近に伴い、安全のため本イベントは中止とさせていただきます。"
                    disabled={isCancelling}
                    rows={3}
                    className="field-sizing-fixed h-18 resize-none overflow-y-auto"
                  />
                </div>

                <p className="text-xs text-slate-500">
                  入力した内容はイベント参加者へメールで一斉送信されます。
                </p>
              </div>
            ) : null}

            {/* ボタン */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isCancelling}
                onClick={handleClose}
                className="cursor-pointer"
              >
                戻る
              </Button>

              <Button
                type="button"
                disabled={!canCancel}
                onClick={handleCancel}
                className="cursor-pointer bg-red-600 text-white hover:bg-red-700"
              >
                {isCancelling ? "送信中…" : "イベントを削除する"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EventCancelModal;
