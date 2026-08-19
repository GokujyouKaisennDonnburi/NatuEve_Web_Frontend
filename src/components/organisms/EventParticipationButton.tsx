"use client";

import { useAuthContext } from "@/components/layouts/AuthProvider";
import { showCompletionToast } from "@/components/molecules/CompletionToast";
import { ParticipationCancelConfirmModal } from "@/components/organisms/participation/ParticipationCancelConfirmModal";
import { ParticipationDetailModal } from "@/components/organisms/participation/ParticipationDetailModal";
import { ParticipationModal } from "@/components/organisms/participation/ParticipationModal";
import { leaveEvent } from "@/services/participate";
import type { EventDetailCost } from "@/types/event";
import type { ParticipationCostBreakdown } from "@/types/participate";
import { LeaveError, LeaveErrorCode } from "@/types/participate";
import { useState } from "react";
import { toast } from "sonner";

// 申し込み内容モーダルに表示する、このユーザー自身の申し込み内容。
// 参加状態 API（participation-logs）から取得した値をそのまま渡す。
export type ParticipationDetail = {
  // 申込日(RFC3339)。取得できない場合は null。
  appliedAt: string | null;
  // カテゴリ別の申し込み内訳。API が返さない場合は undefined となり、内訳の表示を省略する。
  costs?: ParticipationCostBreakdown[];
};

// 参加申し込みボタンのプロパティ
type EventParticipationButtonProps = {
  eventId: string;
  // 申し込みモーダルのヘッダーに出すイベント名
  eventTitle: string;
  // 申し込みモーダルのヘッダーに出す開催日時(RFC3339)
  eventDate: string;
  // 申し込み内容モーダルに出す終了日時(RFC3339)
  eventEndDate: string;
  // 申し込み内容モーダルに出す開催場所
  eventLocation: string;
  // 申し込み内容モーダルのヘッダーに出す主催者名
  organizerName?: string;
  // 参加の取り消し期限(RFC3339)。未設定の場合は期限なしとして扱う。
  cancelDeadline?: string | null;
  // イベントの参加費用カテゴリ。人数選択の行として表示する。
  costs: EventDetailCost[] | undefined;
  disabled?: boolean; // 主催者自身のイベントなどで、参加申し込みを無効化するためのフラグ
  // イベントの定員（参加人数の上限）。未設定時は上限なし。
  capacity?: number;
  // 現在のユーザーが当該イベントに参加中かどうか。true の場合は「参加キャンセル」ボタンを表示する。
  participating?: boolean;
  // 参加中ユーザーの申し込み内容。未参加・未取得の場合は undefined。
  participationDetail?: ParticipationDetail;
  // 参加申し込み成功後に呼ばれるコールバック。参加状態の再取得をトリガーする。
  onParticipateSuccess?: () => void;
  // 参加キャンセル成功後に呼ばれるコールバック。参加状態の再取得をトリガーする。
  onCancelSuccess?: () => void;
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

// 参加申し込みボタンコンポーネント
//
// 申し込みの入力と送信は ParticipationModal が担当し、ここでは開閉のみを扱う。
// 参加中の場合は代わりに参加キャンセルボタンを表示し、
// 押下時はいきなり取り消さず「申し込み内容 → 取り消しの確認」の順にモーダルを重ねる。
export function EventParticipationButton({
  eventId,
  eventTitle,
  eventDate,
  eventEndDate,
  eventLocation,
  organizerName,
  cancelDeadline,
  costs,
  disabled,
  capacity,
  participating = false,
  participationDetail,
  onParticipateSuccess,
  onCancelSuccess,
}: EventParticipationButtonProps) {
  // 申し込みに必要なのはセッションのトークンだけなので、
  // プロフィール取得を待たない isSessionLoading で操作可否を判定する。
  const { isSessionLoading } = useAuthContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 申し込み内容モーダルの開閉状態
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  // 取り消し確認モーダルの開閉状態
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  // 参加キャンセル送信中フラグ
  const [isCancelSubmitting, setIsCancelSubmitting] = useState(false);

  // 参加キャンセルボタンのクリックハンドラ。
  // 取り消しの前に、何を申し込んだのかと取り消し期限を確認できるようにする。
  const handleCancelClick = () => {
    if (disabled || isSessionLoading) return;

    setIsDetailModalOpen(true);
  };

  // 参加申し込みボタンのクリックハンドラ
  const handleButtonClick = () => {
    if (disabled || isSessionLoading) return;

    setIsModalOpen(true);
  };

  // 取り消しの確定。成功したら確認・申し込み内容の両方を閉じ、完了トーストを出す。
  const handleConfirmCancel = () => {
    if (isCancelSubmitting) return;

    setIsCancelSubmitting(true);

    void (async () => {
      try {
        await leaveEvent(eventId);

        showCompletionToast("イベントの参加を取り消しました");

        setIsCancelModalOpen(false);
        setIsDetailModalOpen(false);
        onCancelSuccess?.();
      } catch (error) {
        // 失敗時はモーダルを開いたままにして、やり直せるようにする
        handleLeaveError(error);
      } finally {
        setIsCancelSubmitting(false);
      }
    })();
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

      {/* 申し込み内容モーダル。参加中のユーザーが内容と取り消し期限を確認する。 */}
      <ParticipationDetailModal
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        eventTitle={eventTitle}
        organizerName={organizerName ?? ""}
        appliedAt={participationDetail?.appliedAt ?? null}
        eventDate={eventDate}
        endDate={eventEndDate}
        location={eventLocation}
        cancelDeadline={cancelDeadline}
        costs={participationDetail?.costs}
        onRequestCancel={() => setIsCancelModalOpen(true)}
        isBlocked={isCancelModalOpen}
      />

      {/* 取り消し確認モーダル。申し込み内容モーダルの上に重ねて表示する。 */}
      <ParticipationCancelConfirmModal
        isOpen={isCancelModalOpen}
        eventTitle={eventTitle}
        isSubmitting={isCancelSubmitting}
        onConfirm={handleConfirmCancel}
        onClose={() => setIsCancelModalOpen(false)}
      />
    </>
  );
}

export default EventParticipationButton;
