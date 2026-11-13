"use client";

import { FieldNote } from "@/components/atoms/FieldNote";
import { PillButton } from "@/components/atoms/PillButton";
import { CapacityBar } from "@/components/atoms/participation/CapacityBar";
import { DirectInputHint } from "@/components/atoms/participation/DirectInputHint";
import { PaymentAlertNote } from "@/components/atoms/event-post/PaymentAlertNote";
import { ParticipantCounterRow } from "@/components/molecules/participation/ParticipantCounterRow";
import { ParticipationCostSummary } from "@/components/molecules/participation/ParticipationCostSummary";
import { MAX_PARTICIPATION_PARTY_SIZE } from "@/constants/config";
import type { EventDetailCost } from "@/types/event";
import type {
  ParticipantCounts,
  ParticipationSummary,
} from "@/utils/participation";

// 支払いに関する注意文。投稿画面とは伝えたい内容が異なるため、この画面用の文言を渡す。
const PAYMENT_ALERT_LINES = [
  "イベント指定の方法でお支払いください。",
  "このサイト経由でのお支払いに対応していません。",
];

type ParticipationCountStepProps = {
  costs: EventDetailCost[];
  counts: ParticipantCounts;
  summary: ParticipationSummary;
  // 申し込める上限人数（残り枠）。null のときは残り枠なしとして人数バーを出さない。
  maxCount: number | null;
  // イベントの定員（全体の参加可能人数）。人数バーの分母に使う。
  capacity?: number;
  // 現在申込中の合計参加人数。人数バーの参加人数に選択中の人数を足して表示する。
  participantCount?: number;
  isSubmitting: boolean;
  canSubmit: boolean;
  canIncrement: () => boolean;
  canDecrement: (index: number) => boolean;
  // お客様情報へ戻れるか。戻れない場合は左ボタンを「キャンセル」として閉じる操作にする
  canGoBack: boolean;
  onIncrement: (index: number) => void;
  onDecrement: (index: number) => void;
  onCountChange: (index: number, value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
};

// カテゴリごとの参加人数を選ぶステップ。登録者・未登録者で共通に使う。
export function ParticipationCountStep({
  costs,
  counts,
  summary,
  maxCount,
  capacity,
  participantCount,
  isSubmitting,
  canSubmit,
  canIncrement,
  canDecrement,
  canGoBack,
  onIncrement,
  onDecrement,
  onCountChange,
  onBack,
  onSubmit,
}: Readonly<ParticipationCountStepProps>) {
  // 10人の上限に達したか。達したら案内を赤字にして注意を促す。
  const isAtPartySizeLimit = summary.totalCount >= MAX_PARTICIPATION_PARTY_SIZE;

  return (
    <div className="space-y-5">
      {maxCount !== null && capacity !== undefined ? (
        <CapacityBar
          currentCount={(participantCount ?? 0) + summary.totalCount}
          capacity={capacity}
        />
      ) : null}

      {/* 1回の申し込みで選べるのは10人まで。達したら赤字にして注意を促す。
          残り枠が上限以下のときは残り枠側の制約が先に効くため、この案内は出さない */}
      {maxCount === null || maxCount > MAX_PARTICIPATION_PARTY_SIZE ? (
        <FieldNote tone={isAtPartySizeLimit ? "error" : "default"}>
          一度に申し込めるのは{MAX_PARTICIPATION_PARTY_SIZE}人までです
        </FieldNote>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-800">
            参加人数を選んでください
          </p>

          <DirectInputHint />
        </div>

        <div className="space-y-3">
          {costs.map((cost, index) => (
            <ParticipantCounterRow
              // カテゴリ名・金額はどちらも重複し得るため、値では一意にできない。
              // この一覧は props の並び順そのままで、並べ替えも増減もしないため添字を key にする。
              // biome-ignore lint/suspicious/noArrayIndexKey: 並び順が変化しない固定リストのため添字で一意にする。
              key={index}
              category={cost.category}
              cost={cost.cost}
              count={counts[index] ?? 0}
              canIncrement={canIncrement()}
              canDecrement={canDecrement(index)}
              onIncrement={() => onIncrement(index)}
              onDecrement={() => onDecrement(index)}
              onCountChange={(value) => onCountChange(index, value)}
            />
          ))}
        </div>

        {/* 人数は直上の CapacityBar と各カウンターが示すため、文言では繰り返さない。
            10人の上限到達は上部の案内が担うため、ここは残り枠を使い切った場合だけ出す */}
        {maxCount !== null && summary.totalCount >= maxCount ? (
          <FieldNote tone="error">
            申し込みできる人数をすべて選択しています
          </FieldNote>
        ) : null}
      </div>

      <PaymentAlertNote lines={PAYMENT_ALERT_LINES} />

      <ParticipationCostSummary summary={summary} />

      <div className="flex justify-end gap-3 pt-1">
        <PillButton
          type="button"
          tone="outline"
          disabled={isSubmitting}
          onClick={onBack}
        >
          {canGoBack ? "もどる" : "キャンセル"}
        </PillButton>

        <PillButton type="button" disabled={!canSubmit} onClick={onSubmit}>
          {isSubmitting ? "送信中…" : "この内容で申し込む"}
        </PillButton>
      </div>
    </div>
  );
}
