"use client";

import { useAuthContext } from "@/components/layouts/AuthProvider";
import { ParticipationModal } from "@/components/organisms/participation/ParticipationModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollLock } from "@/hooks/useScrollLock";
import { cn } from "@/lib/utils";
import { leaveEvent } from "@/services/participate";
import type { EventDetailCost } from "@/types/event";
import { LeaveError, LeaveErrorCode } from "@/types/participate";
import { Check } from "lucide-react";
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
  // 現在申込中の合計参加人数。未設定時は 0 として扱う。残り人数は capacity - participantCount で算出する。
  participantCount?: number;
  // 受付終了フラグ。true のとき参加申し込みボタンを無効化し「受付終了」と表示する。
  // 現状は開催終了時（endDate 経過）で判定するが、将来は申込期限の導入を予定している。
  receptionClosed?: boolean;
  // 現在のユーザーが当該イベントに参加中かどうか。true の場合は参加キャンセルボタンを表示する。
  participating?: boolean;
  // 現在のユーザーの参加申込人数（代表者を含む）。参加済み表示用。
  partySize?: number;
  // 参加申し込み成功後に呼ばれるコールバック。参加状態の再取得をトリガーする。
  onParticipateSuccess?: () => void;
  // 参加キャンセル成功後に呼ばれるコールバック。参加状態の再取得をトリガーする。
  onCancelSuccess?: () => void;
};

// 参加申し込みボタンコンポーネント
//
// 表示は定員・プログレスバー・残り人数を内包したピル形式。
// 申し込みの入力と送信は ParticipationModal が担当し、ここではピル表示とモーダル開閉を扱う。
// 参加中の場合は「申し込み済み + 内容の確認・取り消し」を表示する。
export function EventParticipationButton({
  eventId,
  eventTitle,
  eventDate,
  costs,
  disabled,
  capacity,
  participantCount,
  receptionClosed,
  participating = false,
  partySize,
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

  const displayPartySize = partySize ?? 1;

  // 定員・残り人数の計算（残り = capacity - participantCount、swagger 準拠）
  const effectiveCapacity =
    typeof capacity === "number" && capacity >= 0 ? capacity : 0;
  const effectiveCurrent =
    typeof participantCount === "number" ? participantCount : 0;
  const remaining = Math.max(
    effectiveCapacity > 0 ? effectiveCapacity - effectiveCurrent : 0,
    0,
  );
  const hasCapacity = effectiveCapacity > 0;
  const participationRate = hasCapacity
    ? Math.min(effectiveCurrent / effectiveCapacity, 1)
    : 0;
  const isFull = hasCapacity && remaining === 0;
  const isFew =
    hasCapacity &&
    !isFull &&
    (remaining <= effectiveCapacity * 0.2 || remaining <= 10);

  // 未参加ボタンの文言。受付終了が最優先で、次に満員を優先する。
  // 受付終了の判定基準は現状開催終了時だが、将来は申込期限の導入を予定している。
  const buttonLabel = receptionClosed
    ? "受付終了"
    : isFull
      ? "現在満員です"
      : "参加を申し込む";

  // コントロールの無効状態を判定
  const isControlDisabled = disabled || isSessionLoading;

  // 参加キャンセルボタンのクリックハンドラ
  const handleCancelClick = () => {
    if (disabled || isSessionLoading) return;

    setIsCancelModalOpen(true);
  };

  // 参加申し込みボタンのクリックハンドラ。ピル右側のボタンからモーダルを開く。
  const handleButtonClick = () => {
    if (disabled || isSessionLoading || isFull || receptionClosed) return;

    setIsModalOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          "mx-auto flex min-h-[56px] w-full max-w-[480px] items-center justify-between gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-lg sm:min-h-[64px] sm:gap-3 sm:px-5 sm:py-2.5",
          isControlDisabled && !participating && "opacity-70",
        )}
      >
        {participating ? (
          // 参加済み：チェックアイコン + 申込人数 + 内容の確認・取り消しボタン
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#9ABD5A] text-white"
                aria-hidden="true"
              >
                <Check className="size-3" strokeWidth={2.5} />
              </span>
              <span className="text-xs font-bold text-[#173315] sm:text-sm">
                申し込み済み（{displayPartySize}名）
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isSessionLoading || isCancelSubmitting}
              onClick={handleCancelClick}
              className="h-10 w-[140px] shrink-0 rounded-full border-[#9ABD5A] px-2 text-center text-xs font-bold whitespace-nowrap text-[#173315] hover:bg-[#9ABD5A]/10 focus-visible:ring-[#9ABD5A] disabled:opacity-50 sm:h-11 sm:w-[160px] sm:text-sm"
            >
              {isCancelSubmitting ? "送信中…" : "内容の確認・取り消し"}
            </Button>
          </>
        ) : (
          // 未参加：定員・プログレスバー・残り人数 + 参加申込ボタン
          <>
            {hasCapacity ? (
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 sm:text-sm">
                    定員{effectiveCapacity}名
                  </span>
                  {isFull ? (
                    <span className="text-xs font-bold text-red-500 sm:text-sm">
                      満員
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "text-xs font-bold sm:text-sm",
                        isFew ? "text-(--brand-orange)" : "text-[#9ABD5A]",
                      )}
                    >
                      残り{remaining}名
                    </span>
                  )}
                </div>
                <div
                  className="h-1.5 w-full max-w-[270px] overflow-hidden rounded-full bg-slate-100 sm:max-w-[360px]"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={effectiveCapacity}
                  aria-valuenow={effectiveCurrent}
                  aria-label="参加状況"
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isFull || isFew
                        ? "bg-linear-to-r from-[#9ABD5A] to-(--brand-orange)"
                        : "bg-[#9ABD5A]",
                    )}
                    style={{ width: `${participationRate * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <span className="text-xs font-bold text-slate-700 sm:text-sm">
                  定員なし
                </span>
                <span className="text-xs font-bold text-[#9ABD5A] sm:text-sm">
                  現在{effectiveCurrent}名
                </span>
              </div>
            )}
            <Button
              type="button"
              disabled={isControlDisabled || isFull || receptionClosed}
              onClick={handleButtonClick}
              className="h-10 w-[168px] shrink-0 rounded-full bg-[#9ABD5A] px-2 text-center text-xs font-bold whitespace-nowrap text-[#173315] hover:bg-[#A5C869] focus-visible:ring-[#9ABD5A] disabled:cursor-not-allowed disabled:bg-[#C5D9A3] disabled:text-[#173315] disabled:opacity-100 disabled:hover:bg-[#C5D9A3] sm:h-11 sm:w-[192px] sm:text-sm"
            >
              {buttonLabel}
            </Button>
          </>
        )}
      </div>

      {/* 参加申し込みモーダル。未登録者は「お客様情報 → 人数 → 完了」の順に進む。 */}
      <ParticipationModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        eventId={eventId}
        eventTitle={eventTitle}
        eventDate={eventDate}
        costs={costs}
        capacity={capacity}
        participantCount={participantCount}
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
