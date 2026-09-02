"use client";

import { ParticipationCancelNotice } from "@/components/molecules/participation/ParticipationCancelNotice";
import { ParticipationCostSummary } from "@/components/molecules/participation/ParticipationCostSummary";
import {
  ParticipationDetailTable,
  type ParticipationDetailRow,
} from "@/components/molecules/participation/ParticipationDetailTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { EventDetailCost } from "@/types/event";
import type { ParticipantEntry } from "@/types/participate";
import { formatFullDateTime, formatMonthDayTime } from "@/utils/date";
import {
  buildApplicationSummary,
  isCancelDeadlinePassed,
} from "@/utils/participation";
import { X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef } from "react";

type ParticipationDetailModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // ヘッダー2段目に出すイベント名
  eventTitle: string;
  // ヘッダー2段目に出す主催者名
  organizerName: string;
  // 申し込み日時(RFC3339)。取得できない場合は null
  appliedAt: string | null;
  // 開催日時(RFC3339)
  eventDate: string;
  // 終了日時(RFC3339)
  endDate: string;
  // 開催場所
  location: string;
  // 取り消し期限(RFC3339)。未設定なら案内帯を出さない
  cancelDeadline?: string | null;
  // カテゴリ別の申し込み内訳。未取得なら参加費ブロックごと出さない
  participants?: ParticipantEntry[];
  // イベントの費用カテゴリ。申し込み内訳と突合して1名あたりの参加費を補う。
  // 申込内容 API は金額を返さないため、金額の出所はこちらだけになる。
  eventCosts?: EventDetailCost[];
  // 「申し込みを取り消す」「欠席を連絡する」押下時に呼ぶ。
  // 確認モーダルの表示は呼び出し側が担当する
  onRequestCancel: () => void;
  // 取り消し確認モーダルなど、手前に別のモーダルが重なっているかどうか。
  // 重なっている間はこちらを閉じさせない（手前のモーダルだけが Escape に反応する）。
  isBlocked?: boolean;
};

// 申し込み内容モーダル。
//
// 参加済みユーザーが自分の申込内容（日時・場所・参加費）を確認し、
// 取り消し期限内は「申し込みを取り消す」、期限切れ後は「欠席を連絡する」から
// 確認モーダルへ進める。
export function ParticipationDetailModal({
  isOpen,
  onOpenChange,
  eventTitle,
  organizerName,
  appliedAt,
  eventDate,
  endDate,
  location,
  cancelDeadline,
  participants,
  eventCosts,
  onRequestCancel,
  isBlocked = false,
}: Readonly<ParticipationDetailModalProps>) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // 手前に確認モーダルが重なっている間は閉じない。
  // Escape はこのモーダルと確認モーダルの両方が独立に拾うため、
  // ガードしないと 1 回のキー操作で背面のこちらまで閉じてしまう。
  // 取り消し送信中は確認モーダルが開いたままなので、これで送信中の離脱も防げる。
  const handleClose = useCallback(() => {
    if (isBlocked) return;

    onOpenChange(false);
  }, [isBlocked, onOpenChange]);

  const rows = useMemo<ParticipationDetailRow[]>(
    () => [
      {
        label: "申し込み日時",
        value: appliedAt ? formatFullDateTime(appliedAt) : "—",
      },
      { label: "開催日時", value: formatFullDateTime(eventDate) },
      { label: "終了日時", value: formatFullDateTime(endDate) },
      { label: "開催場所", value: location || "—" },
    ],
    [appliedAt, eventDate, endDate, location],
  );

  // 参加費ブロックは申し込み内訳が取れたときだけ出す。
  // 金額はイベントの費用カテゴリとの突合で補うため、突合できない行は金額不明として扱う。
  const summary = useMemo(() => {
    if (!participants || participants.length === 0) return null;

    return buildApplicationSummary(eventCosts, participants);
  }, [participants, eventCosts]);

  const isExpired = isCancelDeadlinePassed(cancelDeadline);

  // 期限は API から返る想定だが、パースできない値だと
  // 「取り消しは — までになっています。」という不自然な文言になるため、
  // 日時として読める場合だけ案内帯を出す（isCancelDeadlinePassed の判定とも揃う）。
  const deadlineLabel = formatMonthDayTime(cancelDeadline ?? "");
  const hasDeadline = deadlineLabel !== "—";

  // モーダル表示中は背景スクロールをロックする
  useScrollLock(isOpen);

  // 開いた直後と、手前の確認モーダルが閉じた直後にフォーカスを引き取る。
  // 背景のボタンへフォーカスが残ったままだと、
  // ブラウザ最小化→復元時の focus イベントで Tooltip が開きっぱなしになるため blur する。
  // 確認モーダルが開いている間（isBlocked）は、そちらへフォーカスを譲る。
  useEffect(() => {
    if (!isOpen || isBlocked) return;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    dialogRef.current?.focus();
  }, [isOpen, isBlocked]);

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
    <div className="fixed inset-0 z-50 flex h-screen items-center justify-center px-4">
      {/* 背景クリックで閉じる */}
      <button
        type="button"
        aria-label="申し込み内容を閉じる"
        className={cn(
          "absolute inset-0 cursor-default",
          // 確認モーダルが重なっている間は、そちらのオーバーレイに暗さを任せる。
          // 両方が bg-black/50 のままだと背景が 75% まで暗くなり、意図より濃く見える。
          isBlocked ? "bg-transparent" : "bg-black/50",
        )}
        onClick={handleClose}
        tabIndex={-1}
      />

      <div
        ref={dialogRef}
        // 開いた直後にフォーカスを受け取るためだけの tabIndex。
        // Tab の巡回順には入れず、プログラム側からのみフォーカスする。
        tabIndex={-1}
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <Card className="border-slate-200 bg-white shadow-xl">
          <CardContent className="space-y-5 px-8 py-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 id={titleId} className="text-xl font-bold text-slate-900">
                  申し込み内容
                </h2>
                {/* 主催者名は取得できないことがあるため、
                    空のときは区切り記号ごと落としてイベント名だけを見せる。 */}
                <p className="text-xs text-slate-500">
                  {organizerName
                    ? `${eventTitle}　|　${organizerName}`
                    : eventTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="申し込み内容を閉じる"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ParticipationDetailTable rows={rows} />

            {summary ? (
              <ParticipationCostSummary
                summary={summary}
                title="参加人数と参加費"
                note="イベント指定の方法でお支払いください。"
              />
            ) : null}

            {hasDeadline ? (
              <ParticipationCancelNotice
                deadlineLabel={deadlineLabel}
                isExpired={isExpired}
              />
            ) : null}

            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-11 rounded-full border-slate-300 px-8 font-semibold text-slate-700"
              >
                閉じる
              </Button>
              {/* 期限切れ後は自分で取り消せないため、主催者への欠席連絡へ導線を変える */}
              <Button
                type="button"
                variant="outline"
                onClick={onRequestCancel}
                className="h-11 rounded-full border-(--danger) px-8 font-semibold text-(--danger) hover:bg-(--danger-soft) hover:text-(--danger)"
              >
                {isExpired ? "欠席を連絡する" : "申し込みを取り消す"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
