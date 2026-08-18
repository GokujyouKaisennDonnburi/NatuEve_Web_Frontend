"use client";

import { FormInput } from "@/components/atoms/FormInput";
import { CounterButton } from "@/components/atoms/participation/CounterButton";
import { formatCostLabel } from "@/utils/participation";

// カテゴリ1件分の人数選択行
type ParticipantCounterRowProps = {
  // カテゴリ名（例: 「大人」）
  category: string;
  // 1名あたりの金額（円）
  cost: number;
  // 選択中の人数
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  // 人数を直接入力したときに呼ばれる。整形と上限の切り詰めは呼び出し側で行う
  onCountChange: (value: string) => void;
  canIncrement: boolean;
  canDecrement: boolean;
};

// カテゴリ1件分の人数選択行
export function ParticipantCounterRow({
  category,
  cost,
  count,
  onIncrement,
  onDecrement,
  onCountChange,
  canIncrement,
  canDecrement,
}: Readonly<ParticipantCounterRowProps>) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
      <div className="flex items-baseline gap-3">
        <span className="text-base font-bold text-slate-900">{category}</span>
        <span className="text-sm text-slate-500">{formatCostLabel(cost)}</span>
      </div>
      <div className="flex items-center gap-3">
        <CounterButton
          variant="decrement"
          onClick={onDecrement}
          disabled={!canDecrement}
          label={`${category}の人数を1減らす`}
        />
        {/* +/- だけでなく直接入力もできるよう、枠のある入力欄にしている。
            大人数の申し込みでボタン連打を強いないための措置。 */}
        <FormInput
          type="text"
          inputMode="numeric"
          value={count}
          onChange={(event) => onCountChange(event.target.value)}
          // 0 が入ったままだと打ち直しになるため、フォーカス時に選択状態にする
          onFocus={(event) => event.target.select()}
          aria-label={`${category}の人数`}
          className="h-9 w-14 rounded-lg px-1 text-center text-base font-bold"
        />
        <CounterButton
          variant="increment"
          onClick={onIncrement}
          disabled={!canIncrement}
          label={`${category}の人数を1増やす`}
        />
      </div>
    </div>
  );
}
