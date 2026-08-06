"use client";

import { RequiredBadge } from "@/components/atoms/RequiredBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notifyEventParticipants } from "@/services/event";
import { useScrollLock } from "@/hooks/useScrollLock";
import { Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

// 全体連絡モーダルのプロパティ
type EventNotifyModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  eventId: string;
  totalCount: number;
  totalMembers: number;
};

// 全体連絡モーダルのコンポーネント
export function EventNotifyModal({
  isOpen,
  onOpenChange,
  eventId,
  totalCount,
  totalMembers,
}: Readonly<EventNotifyModalProps>) {
  // モーダルの状態管理
  const [isSending, setIsSending] = useState(false);
  const [notifySubject, setNotifySubject] = useState("");
  const [notifyBody, setNotifyBody] = useState("");

  // 送信可能かどうかの判定
  const canSend =
    notifySubject.trim().length > 0 &&
    notifyBody.trim().length > 0 &&
    !isSending;

  // モーダルを閉じる処理
  const handleClose = useCallback(() => {
    if (isSending) return;

    onOpenChange(false);
    setNotifySubject("");
    setNotifyBody("");
  }, [isSending, onOpenChange]);

  // 全体連絡を送信する処理
  const handleSend = () => {
    // 送信可能でない場合は処理を中断
    if (!canSend) return;

    setIsSending(true);

    void (async () => {
      try {
        await notifyEventParticipants(eventId, {
          subject: notifySubject.trim(),
          body: notifyBody.trim(),
        });

        toast.success("参加者へ全体連絡を送信しました。");

        handleClose();
      } catch (error) {
        // 送信に失敗した場合はエラーメッセージを表示
        console.error("参加者への通知送信に失敗しました:", error);

        toast.error(
          "参加者への通知送信に失敗しました。時間をおいて再度お試しください。",
        );
      } finally {
        // 送信処理が完了したら、送信中状態を解除
        setIsSending(false);
      }
    })();
  };

  // モーダル表示中は背景スクロールをロックし、Escapeで閉じる
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    // モーダル表示中に背景のツールバーボタンへフォーカスが残ると、
    // ブラウザ最小化→復元時の focus イベントで Tooltip が開きっぱなしになるため blur する
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

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

  // モーダルが開いていない場合は何も表示しない
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-screen items-center justify-center px-4">
      {/* モーダルの背景をクリックしたらモーダルを閉じる */}
      <button
        type="button"
        aria-label="全体連絡モーダルを閉じる"
        className="absolute inset-0 cursor-default bg-black/50"
        onClick={handleClose}
        tabIndex={-1}
      />

      <div
        className="relative w-full max-w-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`event-notify-modal-title-${eventId}`}
      >
        <Card className="border-slate-200 bg-white shadow-xl">
          <CardContent className="space-y-6 px-8 py-2">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <Send className="h-6 w-6" />
              </div>

              <div className="space-y-0.5">
                <h2
                  id={`event-notify-modal-title-${eventId}`}
                  className="text-lg font-bold text-slate-900"
                >
                  イベント参加者へ全体連絡
                </h2>

                <p className="text-sm text-slate-500">
                  参加者 {totalCount}組（{totalMembers}
                  名）全員に、登録メールアドレス宛でお知らせを送信します。
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* 件名 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`notify-subject-${eventId}`}
                    className="text-sm font-semibold text-slate-800"
                  >
                    件名
                  </Label>

                  <RequiredBadge isRequired size="sm" />
                </div>

                <Input
                  id={`notify-subject-${eventId}`}
                  value={notifySubject}
                  onChange={(e) => setNotifySubject(e.target.value)}
                  disabled={isSending}
                  maxLength={255}
                  placeholder="例:【当日連絡】集合場所のご案内"
                  className="h-11 rounded-xl border-slate-300"
                />
              </div>

              {/* 連絡内容 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`notify-body-${eventId}`}
                    className="text-sm font-semibold text-slate-800"
                  >
                    連絡内容
                  </Label>

                  <RequiredBadge isRequired size="sm" />
                </div>

                <Textarea
                  id={`notify-body-${eventId}`}
                  value={notifyBody}
                  onChange={(e) => setNotifyBody(e.target.value)}
                  disabled={isSending}
                  rows={7}
                  placeholder="参加者へのメッセージを入力してください"
                  className="field-sizing-fixed h-40 resize-none rounded-xl border-slate-300"
                />
              </div>
            </div>

            {/* ボタン */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSending}
                onClick={handleClose}
                className="h-11 rounded-full border-slate-300 px-8 font-semibold text-slate-700"
              >
                キャンセル
              </Button>

              <Button
                type="button"
                disabled={!canSend}
                onClick={handleSend}
                className="h-11 gap-2 rounded-full bg-sky-500 px-8 font-semibold text-white hover:bg-sky-600 disabled:bg-sky-300 disabled:text-white"
              >
                <Send className="h-4 w-4 text-white" />
                {isSending ? "送信中..." : "送信する"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
