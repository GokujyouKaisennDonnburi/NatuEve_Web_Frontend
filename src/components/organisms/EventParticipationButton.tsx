"use client";

import { useAuthContext } from "@/components/layouts/AuthProvider";
import { ParticipationModal } from "@/components/organisms/participation/ParticipationModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollLock } from "@/hooks/useScrollLock";
import { leaveEvent } from "@/services/participate";
import type { EventDetailCost } from "@/types/event";
import { LeaveError, LeaveErrorCode } from "@/types/participate";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// 参加申し込みボタンのプロパティ
type EventParticipationButtonProps = {
  eventId: string;
  // 申し込みモーダルのヘッダーに出すイベント名
  eventTitle: string;
  // 申し込みモーダルのヘッダーに出す開催日時(RFC3339)
  eventDate: string;
  // イベントの参加費用カテゴリ。人数選択の行として表示する。
  costs: EventDetailCost[] | undefined;
  disabled?: boolean; // 主催者自身のイベントなどで、参加申し込みを無効化するためのフラグ
  // イベントの定員（参加人数の上限）。未設定時は上限なし。
  capacity?: number;
  // 現在のユーザーが当該イベントに参加中かどうか。true の場合は「参加キャンセル」ボタンを表示する。
  participating?: boolean;
  // 参加申し込み成功後に呼ばれるコールバック。参加状態の再取得をトリガーする。
  onParticipateSuccess?: () => void;
  // 参加キャンセル成功後に呼ばれるコールバック。参加状態の再取得をトリガーする。
  onCancelSuccess?: () => void;
};

// 参加申し込みボタンコンポーネント
//
// 申し込みの入力と送信は ParticipationModal が担当し、ここでは開閉のみを扱う。
// 参加中の場合は代わりに参加キャンセルボタンを表示する。
export function EventParticipationButton({
  eventId,
  eventTitle,
  eventDate,
  costs,
  disabled,
  capacity,
  participating = false,
  onParticipateSuccess,
  onCancelSuccess,
}: EventParticipationButtonProps) {
  // 申し込みに必要なのはセッションのトークンだけなので、
  // プロフィール取得を待たない isSessionLoading で操作可否を判定する。
  const { isSessionLoading } = useAuthContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 参加キャンセル確認モーダルの開閉状態
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  // 参加キャンセル送信中フラグ
  const [isCancelSubmitting, setIsCancelSubmitting] = useState(false);

  // 参加キャンセルボタンのクリックハンドラ
  const handleCancelClick = () => {
    if (disabled || isSessionLoading) return;

    setIsCancelModalOpen(true);
  };

  // 参加申し込みボタンのクリックハンドラ
  const handleButtonClick = () => {
    if (disabled || isSessionLoading) return;

    setIsModalOpen(true);
  };

  return (
    <>
      {participating ? (
        // 参加中：参加キャンセルボタンを表示する
        <button
          type="button"
          className="flex h-10 w-full cursor-pointer items-center justify-center rounded-xl bg-linear-to-r from-rose-500 via-red-500 to-orange-500 px-6 text-base font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:-translate-y-px hover:shadow-xl hover:shadow-rose-500/30 focus-visible:ring-2 focus-visible:ring-rose-500/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || isSessionLoading || isCancelSubmitting}
          onClick={handleCancelClick}
        >
          {isCancelSubmitting ? "送信中…" : "参加キャンセル"}
        </button>
      ) : (
        // 未参加：参加申し込みボタンを表示する
        <button
          type="button"
          className="flex h-10 w-full cursor-pointer items-center justify-center rounded-xl bg-linear-to-r from-teal-600 via-emerald-600 to-cyan-600 px-6 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:-translate-y-px hover:shadow-xl hover:shadow-teal-500/30 focus-visible:ring-2 focus-visible:ring-teal-500/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || isSessionLoading}
          onClick={handleButtonClick}
        >
          参加申し込み
        </button>
      )}

      {/* 参加申し込みモーダル。未登録者は「お客様情報 → 人数 → 完了」の順に進む。 */}
      <ParticipationModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        eventId={eventId}
        eventTitle={eventTitle}
        eventDate={eventDate}
        costs={costs}
        capacity={capacity}
        onParticipateSuccess={onParticipateSuccess}
      />

      {/* 参加キャンセル確認モーダル */}
      {isCancelModalOpen ? (
        <CancelParticipationModal
          eventId={eventId}
          onClose={() => setIsCancelModalOpen(false)}
          isSubmitting={isCancelSubmitting}
          setIsSubmitting={setIsCancelSubmitting}
          onSuccess={onCancelSuccess}
        />
      ) : null}
    </>
  );
}

export default EventParticipationButton;

// 参加キャンセル確認モーダル
type CancelParticipationModalProps = {
  eventId: string;
  onClose: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  // キャンセル成功後に呼ばれるコールバック。参加状態の再取得をトリガーする。
  onSuccess?: () => void;
};

// 参加キャンセルのエラーを種別ごとにトーストへ振り分ける
const handleLeaveError = (error: unknown) => {
  if (error instanceof LeaveError) {
    switch (error.code) {
      // イベント不存在 または 未参加
      case LeaveErrorCode.NotFound:
        toast.error(
          error.message || "イベントが見つからない、または参加していません。",
        );
        return;
      case LeaveErrorCode.Unauthorized:
        toast.error(error.message || "認証が必要です。");
        return;
      case LeaveErrorCode.InvalidRequest:
        toast.error(error.message || "リクエストが不正です。");
        return;
      default:
        toast.error(error.message);
        return;
    }
  }

  console.error("参加キャンセルに失敗しました。", error);
  toast.error("参加キャンセルに失敗しました。時間をおいて再度お試しください。");
};

// 参加キャンセル確認モーダルコンポーネント
// POST /api/v1/events/{id}/leave を呼び出して参加をキャンセルする。
const CancelParticipationModal = ({
  eventId,
  onClose,
  isSubmitting,
  setIsSubmitting,
  onSuccess,
}: CancelParticipationModalProps) => {
  // 背景スクロールをロックする
  useScrollLock(true);

  // Escape キーでモーダルを閉じる
  useEffect(() => {
    // モーダル表示中に背景のツールバーボタンへフォーカスが残ると、
    // ブラウザ最小化→復元時の focus イベントで Tooltip が開きっぱなしになるため blur する
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onClose]);

  // キャンセル確定処理
  const handleConfirm = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await leaveEvent(eventId);
      toast.success("参加キャンセルを受け付けました。");
      onSuccess?.();
      onClose();
    } catch (error) {
      handleLeaveError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex h-screen items-center justify-center px-4">
      {/* 背景オーバーレイ */}
      <button
        type="button"
        aria-label="参加キャンセルを閉じる"
        className="absolute inset-0 cursor-default bg-black/50"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        tabIndex={-1}
      />
      <div
        className="relative w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-participation-modal-title"
      >
        <Card className="border-slate-200/80 bg-white/95 shadow-xl backdrop-blur">
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-1">
              <h2
                id="cancel-participation-modal-title"
                className="text-lg font-bold text-slate-900"
              >
                参加キャンセル
              </h2>
              <p className="text-sm text-slate-600">
                参加をキャンセルしますか？
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={onClose}
                className="cursor-pointer"
              >
                戻る
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirm}
                className="cursor-pointer bg-linear-to-r from-rose-500 via-red-500 to-orange-500 text-white"
              >
                {isSubmitting ? "送信中…" : "キャンセルを確定する"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
