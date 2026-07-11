"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notifyEventParticipants } from "@/services/event";
import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type EventNotifyButtonProps = {
  eventId: string;
};

export function EventNotifyButton({ eventId }: EventNotifyButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notifySubject, setNotifySubject] = useState("");
  const [notifyBody, setNotifyBody] = useState("");

  const canSend =
    notifySubject.trim().length > 0 &&
    notifyBody.trim().length > 0 &&
    !isSending;

  const handleSend = () => {
    if (!canSend) return;

    setIsSending(true);

    void (async () => {
      try {
        await notifyEventParticipants(eventId, {
          subject: notifySubject.trim(),
          body: notifyBody.trim(),
        });
        toast.success("参加者へ全体連絡を送信しました。");
        setIsModalOpen(false);
        setNotifySubject("");
        setNotifyBody("");
      } catch (error) {
        console.error("参加者への通知送信に失敗しました:", error);
        toast.error(
          "参加者への通知送信に失敗しました。時間をおいて再度お試しください。",
        );
      } finally {
        setIsSending(false);
      }
    })();
  };

  // モーダル表示中は背景スクロールをロックし、Escape で閉じる
  useEffect(() => {
    if (!isModalOpen) return;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  return (
    <>
      <Button
        size="sm"
        className="cursor-pointer border border-transparent hover:border-slate-300"
        onClick={() => setIsModalOpen(true)}
        disabled={isSending}
      >
        <Megaphone className="h-4 w-4 mr-2" />
        全体連絡
      </Button>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="全体連絡モーダルを閉じる"
            className="absolute inset-0 cursor-default bg-black/50"
            onClick={() => setIsModalOpen(false)}
            tabIndex={-1}
          />
          <div
            className="relative w-full max-w-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`event-notify-modal-title-${eventId}`}
          >
            <Card className="border-slate-200/80 bg-white/95 shadow-xl backdrop-blur">
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-1">
                  <h2
                    id={`event-notify-modal-title-${eventId}`}
                    className="text-lg font-bold text-slate-900"
                  >
                    イベント参加者へ全体連絡
                  </h2>
                  <p className="text-sm text-slate-600">
                    入力した内容はイベント参加者へ一斉送信されます。
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`notify-subject-${eventId}`}>
                      件名
                      <span className="ml-1 text-red-600">(必須)</span>
                    </Label>
                    <Input
                      id={`notify-subject-${eventId}`}
                      type="text"
                      value={notifySubject}
                      onChange={(e) => setNotifySubject(e.target.value)}
                      placeholder="例:【お知らせ】集合場所の変更について"
                      disabled={isSending}
                      maxLength={255}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`notify-body-${eventId}`}>
                      連絡内容
                      <span className="ml-1 text-red-600">(必須)</span>
                    </Label>
                    <Textarea
                      id={`notify-body-${eventId}`}
                      value={notifyBody}
                      onChange={(e) => setNotifyBody(e.target.value)}
                      placeholder="例:当日の集合場所をA公園からB公園に変更しました。ご注意ください。"
                      disabled={isSending}
                      rows={4}
                      required
                      className="field-sizing-fixed h-[6rem] resize-none overflow-y-auto"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    入力した内容はイベント参加者へメールで一斉送信されます。
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSending}
                    onClick={() => setIsModalOpen(false)}
                    className="cursor-pointer"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    disabled={!canSend}
                    className="cursor-pointer bg-teal-600 text-white hover:bg-teal-700"
                    onClick={handleSend}
                  >
                    {isSending ? "送信中…" : "送信する"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
