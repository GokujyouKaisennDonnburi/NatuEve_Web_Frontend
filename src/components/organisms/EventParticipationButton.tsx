"use client";

import { useAuthContext } from "@/components/layouts/AuthProvider";
import { showCompletionToast } from "@/components/molecules/CompletionToast";
import { ParticipationCancelConfirmModal } from "@/components/organisms/participation/ParticipationCancelConfirmModal";
import { ParticipationDetailModal } from "@/components/organisms/participation/ParticipationDetailModal";
import { ParticipationModal } from "@/components/organisms/participation/ParticipationModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { leaveEvent } from "@/services/participate";
import type { EventDetailCost } from "@/types/event";
import type { ParticipationCostBreakdown } from "@/types/participate";
import { LeaveError, LeaveErrorCode } from "@/types/participate";
import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// 申し込み内容モーダルに表示する、このユーザー自身の申し込み内容。
// 参加状態 API（participation-logs）から取得した値をそのまま渡す。
export type ParticipationDetail = {
  // 申し込み日時(RFC3339)。取得できない場合は null。
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
  // 現在申込中の合計参加人数。未設定時は 0 として扱う。残り人数は capacity - participantCount で算出する。
  participantCount?: number;
  // 受付終了フラグ。true のとき参加申し込みボタンを無効化し「受付終了」と表示する。
  // 現状は開催終了時（endDate 経過）で判定するが、将来は申込期限の導入を予定している。
  receptionClosed?: boolean;
  // 現在のユーザーが当該イベントに参加中かどうか。true の場合は参加キャンセルボタンを表示する。
  participating?: boolean;
  // 参加中ユーザーの申し込み内容。未参加・未取得の場合は undefined。
  participationDetail?: ParticipationDetail;
  // 現在のユーザーの参加申込人数（代表者を含む）。参加済み表示用。
  partySize?: number;
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
// 表示は定員・プログレスバー・残り人数を内包したピル形式。
// 申し込みの入力と送信は ParticipationModal が担当し、ここではピル表示とモーダル開閉を扱う。
// 参加中の場合は「申し込み済み + 内容の確認・取り消し」を表示し、
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
  participantCount,
  receptionClosed,
  participating = false,
  participationDetail,
  partySize,
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
  // 残りわずかの判定は「定員の20%以下、かつ10人以下」とする。
  // 小規模（定員<=50）では20%が実効閾値となり開始時から発火せず、
  // 大規模では上限10人でクランプされ、残り人数が多いのに発火しないのを防ぐ。
  const isFew =
    hasCapacity &&
    !isFull &&
    remaining <= Math.min(effectiveCapacity * 0.2, 10);

  // 未参加ボタンの文言。受付終了が最優先で、次に満員を優先する。
  // 受付終了の判定基準は現状開催終了時だが、将来は申込期限の導入を予定している。
  const buttonLabel = receptionClosed
    ? "受付終了"
    : isFull
      ? "現在満員です"
      : "参加を申し込む";

  // コントロールの無効状態を判定
  const isControlDisabled = disabled || isSessionLoading;

  // 「内容の確認・取り消し」ボタンのクリックハンドラ。
  // 取り消しの前に、何を申し込んだのかと取り消し期限を確認できるようにする。
  const handleCancelClick = () => {
    if (isControlDisabled) return;

    setIsDetailModalOpen(true);
  };

  // 参加申し込みボタンのクリックハンドラ。ピル右側のボタンからモーダルを開く。
  const handleButtonClick = () => {
    if (disabled || isSessionLoading || isFull || receptionClosed) return;

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
                        isFew ? "text-[#DE8F28]" : "text-[#9ABD5A]",
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
