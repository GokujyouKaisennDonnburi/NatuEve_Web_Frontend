"use client";

import { ParticipationModalHeader } from "@/components/molecules/participation/ParticipationModalHeader";
import type { ParticipationStepView } from "@/components/molecules/participation/ParticipationStepper";
import { ParticipationCompleteStep } from "@/components/organisms/participation/ParticipationCompleteStep";
import { ParticipationCountStep } from "@/components/organisms/participation/ParticipationCountStep";
import { ParticipationGuestInfoStep } from "@/components/organisms/participation/ParticipationGuestInfoStep";
import { Card, CardContent } from "@/components/ui/card";
import {
  PARTICIPATION_STEP_LABELS,
  ParticipationStepId,
  useParticipationForm,
} from "@/hooks/useParticipationForm";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { EventDetailCost } from "@/types/event";
import { formatMonthDayTime } from "@/utils/date";
import { useCallback, useEffect, useId, useMemo, useRef } from "react";

type ParticipationModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  eventId: string;
  eventTitle: string;
  // 開催日時(RFC3339)。ヘッダーの補足表示に使う。
  eventDate: string;
  costs: EventDetailCost[] | undefined;
  capacity: number | undefined;
  // 現在申込中の合計参加人数。残り枠（capacity - participantCount）の算出に使う。
  participantCount?: number;
  // 申し込み成功後に呼ばれる。参加状態の再取得に使う。
  onParticipateSuccess?: () => void;
};

// 参加申し込みモーダル。
//
// 未登録者は「お客様情報 → 人数 → 完了」、ログイン済みは「人数 → 完了」の順に進む。
// 状態と送信は useParticipationForm に委ね、ここでは表示とモーダルの挙動を担当する。
export function ParticipationModal({
  isOpen,
  onOpenChange,
  eventId,
  eventTitle,
  eventDate,
  costs,
  capacity,
  participantCount,
  onParticipateSuccess,
}: Readonly<ParticipationModalProps>) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const {
    step,
    steps,
    costs: resolvedCosts,
    counts,
    summary,
    maxCount,
    isAtCapacity,
    username,
    mailAddress,
    errors,
    isSubmitting,
    canGoNext,
    canGoBack,
    canSubmit,
    canIncrement,
    canDecrement,
    setUsername,
    setMailAddress,
    touchUsername,
    touchMailAddress,
    increment,
    decrement,
    setCount,
    goNext,
    goBack,
    submit,
    reset,
  } = useParticipationForm({
    eventId,
    costs,
    capacity,
    participantCount,
    onSuccess: onParticipateSuccess,
  });

  // 送信中は閉じさせない。API の結果を受け取る前に状態が失われるのを防ぐ。
  //
  // 閉じる時点で初期化しておくことで、開き直した瞬間に前回の完了画面が
  // 一瞬見えてしまうのを避ける。
  const handleClose = useCallback(() => {
    if (isSubmitting) return;

    reset();
    onOpenChange(false);
  }, [isSubmitting, onOpenChange, reset]);

  // ステッパーの表示。現在地までを到達済み（緑）として塗る。
  const stepViews = useMemo<ParticipationStepView[]>(() => {
    const currentIndex = steps.indexOf(step);

    return steps.map((stepId, index) => ({
      key: stepId,
      label: PARTICIPATION_STEP_LABELS[stepId],
      indicator: stepId === ParticipationStepId.Complete ? "check" : index + 1,
      isActive: index <= currentIndex,
      isCurrent: index === currentIndex,
    }));
  }, [steps, step]);

  const isComplete = step === ParticipationStepId.Complete;

  // 日時を取得できない場合は「〜」を付けず、整形結果をそのまま見せる。
  const formattedEventDate = formatMonthDayTime(eventDate);
  const eventDateLabel =
    formattedEventDate === "—" ? formattedEventDate : `${formattedEventDate}〜`;

  // モーダル表示中は背景スクロールをロックする
  useScrollLock(isOpen);

  // 開いた直後に一度だけ行う初期化。
  // reset / step は他の要因でも変化するが、ここで見たいのは「閉→開」の遷移だけなので
  // 依存は isOpen に絞る。ステップ途中でフォーカスを奪い返さないためでもある。
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset と step は開いた瞬間の値だけを使う意図。
  useEffect(() => {
    if (!isOpen) return;

    // 前回の入力・ステップを持ち越さないよう初期化する
    reset();

    // モーダル表示中に背景のボタンへフォーカスが残ると、
    // ブラウザ最小化→復元時の focus イベントで Tooltip が開きっぱなしになるため blur する
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // お客様情報ステップは入力欄側が自分でフォーカスを取るため、
    // それ以外のステップだけダイアログ本体へフォーカスを移して操作起点を作る。
    if (step !== ParticipationStepId.GuestInfo) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

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
        aria-label="参加申し込みモーダルを閉じる"
        className="absolute inset-0 cursor-default bg-black/50"
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
          <CardContent className="space-y-6 px-8 py-2">
            <ParticipationModalHeader
              title={isComplete ? "申し込み完了" : "参加を申し込む"}
              titleId={titleId}
              eventTitle={eventTitle}
              eventDateLabel={eventDateLabel}
              steps={stepViews}
              onClose={handleClose}
            />

            {/* 完了画面はヘッダーと結果を線で切り分ける */}
            {isComplete ? (
              <div className="-mx-8 border-t border-slate-200" />
            ) : null}

            {step === ParticipationStepId.GuestInfo ? (
              <ParticipationGuestInfoStep
                username={username}
                mailAddress={mailAddress}
                errors={errors}
                canGoNext={canGoNext}
                onUsernameChange={setUsername}
                onMailAddressChange={setMailAddress}
                onUsernameBlur={touchUsername}
                onMailAddressBlur={touchMailAddress}
                onBack={handleClose}
                onNext={goNext}
              />
            ) : null}

            {step === ParticipationStepId.Count ? (
              <ParticipationCountStep
                costs={resolvedCosts}
                counts={counts}
                summary={summary}
                maxCount={maxCount}
                isAtCapacity={isAtCapacity}
                isSubmitting={isSubmitting}
                canSubmit={canSubmit}
                canIncrement={canIncrement}
                canDecrement={canDecrement}
                canGoBack={canGoBack}
                onIncrement={increment}
                onDecrement={decrement}
                onCountChange={setCount}
                onBack={canGoBack ? goBack : handleClose}
                onSubmit={submit}
              />
            ) : null}

            {isComplete ? <ParticipationCompleteStep /> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
