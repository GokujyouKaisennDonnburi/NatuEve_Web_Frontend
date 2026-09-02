"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollLock } from "@/hooks/useScrollLock";
import { cn } from "@/lib/utils";
import type { AbsenceReason } from "@/types/participate";
import { TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

// 欠席理由の選択肢。value は欠席連絡 API の reason に対応する。
const ABSENCE_REASON_OPTIONS: ReadonlyArray<{
  value: AbsenceReason;
  label: string;
}> = [
  { value: "illness", label: "体調不良" },
  { value: "family", label: "家庭の都合" },
  { value: "weather_transport", label: "天候・交通" },
  { value: "other", label: "その他" },
];

type ParticipationAbsenceModalProps = {
  isOpen: boolean;
  // ヘッダー2段目に出すイベント名
  eventTitle: string;
  // 整形済みの取り消し期限（例: 「9月5日 17:00」）
  deadlineLabel: string;
  // 最終確認モーダルが手前に重なっているかどうか。
  // 重なっている間はこちらを閉じさせない（手前のモーダルだけが Escape に反応する）。
  isBlocked?: boolean;
  // 「欠席を連絡する」押下時に、選択された欠席理由を渡して呼ぶ。
  // 理由は任意選択のため未選択なら null を渡す。最終確認の表示は呼び出し側が担当する。
  onSubmit: (reason: AbsenceReason | null) => void;
  // 「やめる」「背景」「Escape」で呼ぶ
  onClose: () => void;
};

// 欠席連絡モーダル。
//
// 申込期限を過ぎた参加者が、取り消しの代わりに主催者へ欠席を伝えるための入口。
// ここでは理由を選ぶところまでを担当し、送信は最終確認モーダルを挟んでから行う。
// 申し込み内容モーダル（z-50）の上に重ねるため z-[60] を使う。
export function ParticipationAbsenceModal({
  isOpen,
  eventTitle,
  deadlineLabel,
  isBlocked = false,
  onSubmit,
  onClose,
}: Readonly<ParticipationAbsenceModalProps>) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  // 選択中の欠席理由。任意入力のため未選択（null）のまま送信できる。
  const [reason, setReason] = useState<AbsenceReason | null>(null);

  // 手前に最終確認モーダルが重なっている間は閉じない。
  // Escape は両方のモーダルが独立に拾うため、
  // ガードしないと 1 回のキー操作で背面のこちらまで閉じてしまう。
  const handleClose = useCallback(() => {
    if (isBlocked) return;

    onClose();
  }, [isBlocked, onClose]);

  // モーダル表示中は背景スクロールをロックする
  useScrollLock(isOpen);

  // 閉じたときに選択をリセットし、開き直したときへ持ち越さないようにする。
  // 最終確認から「やめる」で戻る間は開いたままなので、選択はそのまま残る。
  useEffect(() => {
    if (isOpen) return;

    setReason(null);
  }, [isOpen]);

  // 開いた直後と、手前の最終確認モーダルが閉じた直後にフォーカスを引き取る。
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
    <div className="fixed inset-0 z-[60] flex h-screen items-center justify-center px-4">
      {/* 背景クリックで閉じる */}
      <button
        type="button"
        aria-label="欠席連絡を閉じる"
        className={cn(
          "absolute inset-0 cursor-default",
          // 最終確認が重なっている間は、そちらのオーバーレイに暗さを任せる。
          // 両方が bg-black/50 のままだと背景が意図より濃く見える。
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
        className="relative w-full max-w-lg outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <Card className="border-slate-200 bg-white shadow-xl">
          <CardContent className="space-y-5 px-8 py-2">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--danger-soft) text-(--danger)">
                <TriangleAlert className="h-6 w-6" />
              </div>

              <div className="space-y-0.5">
                <h2 id={titleId} className="text-lg font-bold text-slate-900">
                  欠席を連絡しますか？
                </h2>
                <p className="text-sm text-slate-500">{eventTitle}</p>
              </div>
            </div>

            <div className="rounded-xl bg-(--danger-soft) px-4 py-3 text-sm leading-relaxed text-(--danger-text)">
              <p>期限（{deadlineLabel}）を過ぎています。</p>
              <p>主催者に欠席の連絡が届きます。</p>
            </div>

            <fieldset>
              <legend className="mb-2 flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  欠席理由
                </span>
                <span className="text-xs text-slate-400">任意</span>
              </legend>

              {/* 未選択でも送信できるため、選択済みの理由はもう一度押すと解除できる */}
              <div className="flex flex-wrap gap-2">
                {ABSENCE_REASON_OPTIONS.map((option) => {
                  const isSelected = reason === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        setReason(isSelected ? null : option.value)
                      }
                      className={cn(
                        "inline-flex h-9 cursor-pointer items-center rounded-full border px-4 text-sm transition-colors",
                        isSelected
                          ? "border-(--danger) bg-(--danger-soft) font-semibold text-(--danger)"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-11 rounded-full border-slate-300 px-8 font-semibold text-slate-700"
              >
                やめる
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onSubmit(reason)}
                className="h-11 rounded-full border-(--danger) px-8 font-semibold text-(--danger) hover:bg-(--danger-soft) hover:text-(--danger)"
              >
                欠席を連絡する
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
