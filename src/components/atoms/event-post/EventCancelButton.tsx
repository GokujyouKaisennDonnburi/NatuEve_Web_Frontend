"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants/routes";
import { deleteEvent, notifyEventParticipants } from "@/services/event";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type EventCancelButtonProps = {
  eventId: string;
};

export function EventCancelButton({ eventId }: EventCancelButtonProps) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notifySubject, setNotifySubject] = useState("");
  const [notifyBody, setNotifyBody] = useState("");
  // 通知送信済みフラグ: 「通知 → 削除」順で通知成功後に削除が失敗した場合、
  // 再試行時は通知をスキップして削除のみ行い、重複送信を防ぐ。
  const [isNotified, setIsNotified] = useState(false);

  const canDelete =
    notifySubject.trim().length > 0 &&
    notifyBody.trim().length > 0 &&
    !isDeleting;

  const handleCancel = () => {
    if (!canDelete) return;

    setIsDeleting(true);

    void (async () => {
      // 通知は「イベント開催中」しか送れないため先に送信する。
      // isNotited の場合はスキップ（重複防止）。
      if (!isNotified) {
        try {
          await notifyEventParticipants(eventId, {
            subject: notifySubject.trim(),
            body: notifyBody.trim(),
          });
          setIsNotified(true);
        } catch (error) {
          console.error("参加者への通知送信に失敗しました:", error);
          toast.error(
            "参加者への通知送信に失敗しました。時間をおいて再度お試しください。",
          );
          setIsDeleting(false);
          return;
        }
      }

      // 通知成功後（または送信済み）に削除を実行。
      try {
        await deleteEvent(eventId);
        toast.success(
          "イベント投稿をキャンセルし、参加者へ通知を送信しました。",
        );
        setIsConfirmOpen(false);
        router.push(ROUTES.EVENT_LIST);
      } catch (error) {
        console.error("イベント投稿のキャンセルに失敗しました:", error);
        toast.error(
          "通知は送信済みです。イベント削除に失敗しました。「削除する」を再押下で削除のみ再試行できます。",
        );
      } finally {
        setIsDeleting(false);
      }
    })();
  };

  useEffect(() => {
    if (!isConfirmOpen) return;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsConfirmOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isConfirmOpen]);

  return (
    <>
      <Button
        size="lg"
        className="w-full cursor-pointer rounded-full bg-red-600 px-6 py-6 text-base font-semibold text-white shadow-lg shadow-red-500/25 transition hover:-translate-y-px hover:shadow-xl hover:shadow-red-500/30 focus-visible:ring-red-500/30 disabled:opacity-50"
        onClick={() => setIsConfirmOpen(true)}
        disabled={isDeleting}
      >
        {isDeleting ? "削除中…" : "投稿をキャンセルする"}
      </Button>

      {isConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="削除確認を閉じる"
            className="absolute inset-0 cursor-default bg-black/50"
            onClick={() => setIsConfirmOpen(false)}
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
                    イベント投稿を削除しますか？
                  </h2>
                  <p className="text-sm text-slate-600">
                    この操作は取り消せません。
                    <br />
                    投稿内容は削除され、イベント一覧へ移動します。
                  </p>
                </div>

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
                      disabled={isDeleting}
                      maxLength={255}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`cancel-notify-body-${eventId}`}>
                      中止理由
                      <span className="ml-1 text-red-600">(必須)</span>
                    </Label>
                    <Textarea
                      id={`cancel-notify-body-${eventId}`}
                      value={notifyBody}
                      onChange={(e) => setNotifyBody(e.target.value)}
                      placeholder="例:主催者の都合により中止となりました。ご参加予定でした皆様にはお詫び申し上げます。"
                      disabled={isDeleting}
                      rows={3}
                      required
                      className="field-sizing-fixed h-[4.5rem] resize-none overflow-y-auto"
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
                    disabled={isDeleting}
                    onClick={() => setIsConfirmOpen(false)}
                    className="cursor-pointer"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    disabled={!canDelete}
                    className="cursor-pointer bg-red-600 text-white hover:bg-red-700"
                    onClick={handleCancel}
                  >
                    {isDeleting ? "削除中…" : "削除する"}
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
