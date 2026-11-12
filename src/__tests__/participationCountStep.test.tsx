import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ParticipationCountStep } from "@/components/organisms/participation/ParticipationCountStep";
import { MAX_PARTICIPATION_PARTY_SIZE } from "@/constants/config";
import type { EventDetailCost } from "@/types/event";
import {
  buildParticipationSummary,
  type ParticipantCounts,
} from "@/utils/participation";

const COSTS: EventDetailCost[] = [{ category: "大人", cost: 1000 }];

const PARTY_SIZE_NOTE = `一度に申し込めるのは${MAX_PARTICIPATION_PARTY_SIZE}人までです`;
const CAPACITY_FULL_NOTE = "申し込みできる人数をすべて選択しています";

type RenderStepOptions = {
  counts: ParticipantCounts;
  maxCount: number | null;
  effectiveMaxCount: number;
};

function renderStep({
  counts,
  maxCount,
  effectiveMaxCount,
}: RenderStepOptions) {
  return render(
    <ParticipationCountStep
      costs={COSTS}
      counts={counts}
      summary={buildParticipationSummary(COSTS, counts)}
      maxCount={maxCount}
      effectiveMaxCount={effectiveMaxCount}
      isSubmitting={false}
      canSubmit
      canIncrement={() => true}
      canDecrement={() => true}
      canGoBack={false}
      onIncrement={vi.fn()}
      onDecrement={vi.fn()}
      onCountChange={vi.fn()}
      onBack={vi.fn()}
      onSubmit={vi.fn()}
    />,
  );
}

describe("ParticipationCountStep の人数上限の案内", () => {
  it("10人を選択すると上限の案内を赤で表示する", () => {
    renderStep({ counts: [10], maxCount: 100, effectiveMaxCount: 10 });

    expect(screen.getByText(PARTY_SIZE_NOTE)).toHaveClass("text-rose-600");
  });

  it("10人未満では上限の案内を通常色で表示する", () => {
    renderStep({ counts: [5], maxCount: 100, effectiveMaxCount: 10 });

    const note = screen.getByText(PARTY_SIZE_NOTE);
    expect(note).toHaveClass("text-slate-500");
    expect(note).not.toHaveClass("text-rose-600");
  });

  it("残り枠が上限より多いときは、すべて選択のメモを出さない", () => {
    renderStep({ counts: [10], maxCount: 100, effectiveMaxCount: 10 });

    expect(screen.queryByText(CAPACITY_FULL_NOTE)).toBeNull();
  });

  it("残り枠が上限以下のときは、すべて選択のメモだけを表示する", () => {
    renderStep({ counts: [5], maxCount: 5, effectiveMaxCount: 5 });

    expect(screen.queryByText(PARTY_SIZE_NOTE)).toBeNull();
    expect(screen.getByText(CAPACITY_FULL_NOTE)).toHaveClass("text-rose-600");
  });

  it("人数バーは残り枠ではなく実効上限を表示する", () => {
    renderStep({ counts: [2], maxCount: 100, effectiveMaxCount: 10 });

    expect(screen.getByText("2/10名")).toBeInTheDocument();
  });
});
