"use client";

import { X } from "lucide-react";

import {
  ParticipationStepper,
  type ParticipationStepView,
} from "@/components/molecules/participation/ParticipationStepper";

// モーダル上部のタイトル・サブタイトル・閉じるボタン・ステッパー
type ParticipationModalHeaderProps = {
  // 見出し（例: 「参加を申し込む」「申し込み完了」）
  title: string;
  // 見出しと紐づける id。呼び出し側の aria-labelledby と一致させる
  titleId: string;
  // イベント名
  eventTitle: string;
  // 整形済みの開催日時（例: 「8月11日 19:00〜」）
  eventDateLabel: string;
  steps: ParticipationStepView[];
  onClose: () => void;
};

// モーダル上部のタイトル・サブタイトル・閉じるボタン・ステッパー
export function ParticipationModalHeader({
  title,
  titleId,
  eventTitle,
  eventDateLabel,
  steps,
  onClose,
}: Readonly<ParticipationModalHeaderProps>) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 id={titleId} className="text-xl font-bold text-slate-900">
            {title}
          </h2>
          <p className="text-xs text-slate-500">
            {eventTitle}　|　{eventDateLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="申し込みを閉じる"
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <ParticipationStepper steps={steps} />
    </div>
  );
}
