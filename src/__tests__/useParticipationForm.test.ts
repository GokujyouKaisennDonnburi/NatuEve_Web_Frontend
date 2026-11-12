import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MAX_PARTICIPATION_PARTY_SIZE } from "@/constants/config";
import { useParticipationForm } from "@/hooks/useParticipationForm";

// AuthProvider（Supabase セッション）に依存するため、待ち時間ゼロの未ログイン状態へ差し替える。
vi.mock("@/components/layouts/AuthProvider", () => ({
  useAuthContext: () => ({ isSessionLoading: false }),
}));

const COSTS = [
  { category: "大人", cost: 1000 },
  { category: "子供", cost: 500 },
];

type RenderFormOptions = {
  capacity?: number;
  participantCount?: number;
};

function renderForm(options: RenderFormOptions = {}) {
  return renderHook(() =>
    useParticipationForm({
      eventId: "event-1",
      costs: COSTS,
      capacity: options.capacity,
      participantCount: options.participantCount,
    }),
  );
}

describe("useParticipationForm の申し込み人数の上限", () => {
  it("残り枠が上限より多くても、合計10人で増加が止まる", () => {
    const { result } = renderForm({ capacity: 100 });

    act(() => {
      for (let i = 0; i < 20; i++) {
        result.current.increment(0);
      }
    });

    expect(result.current.summary.totalCount).toBe(
      MAX_PARTICIPATION_PARTY_SIZE,
    );
    expect(result.current.counts[0]).toBe(MAX_PARTICIPATION_PARTY_SIZE);
    expect(result.current.canIncrement()).toBe(false);
  });

  it("直接入力で上限を超える値は上限に切り詰める", () => {
    const { result } = renderForm({ capacity: 100 });

    act(() => {
      result.current.setCount(0, "11");
    });

    expect(result.current.counts[0]).toBe(MAX_PARTICIPATION_PARTY_SIZE);
  });

  it("他のカテゴリの人数を除いた枠までしか入力できない", () => {
    const { result } = renderForm({ capacity: 100 });

    act(() => {
      result.current.setCount(0, "5");
    });
    act(() => {
      result.current.setCount(1, "6");
    });

    expect(result.current.counts[0]).toBe(5);
    expect(result.current.counts[1]).toBe(5);
    expect(result.current.summary.totalCount).toBe(
      MAX_PARTICIPATION_PARTY_SIZE,
    );
  });

  it("定員が未設定でも合計10人で増加が止まる", () => {
    const { result } = renderForm();

    act(() => {
      for (let i = 0; i < 20; i++) {
        result.current.increment(0);
      }
    });

    expect(result.current.maxCount).toBeNull();
    expect(result.current.effectiveMaxCount).toBe(MAX_PARTICIPATION_PARTY_SIZE);
    expect(result.current.summary.totalCount).toBe(
      MAX_PARTICIPATION_PARTY_SIZE,
    );
    expect(result.current.canIncrement()).toBe(false);
  });

  it("残り枠が10人未満のときは残り枠で増加が止まる", () => {
    const { result } = renderForm({ capacity: 8, participantCount: 3 });

    expect(result.current.maxCount).toBe(5);
    expect(result.current.effectiveMaxCount).toBe(5);

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.increment(0);
      }
    });

    expect(result.current.summary.totalCount).toBe(5);
    expect(result.current.canIncrement()).toBe(false);
  });

  it("残り枠が10人未満なら直接入力も残り枠に切り詰める", () => {
    const { result } = renderForm({ capacity: 5 });

    act(() => {
      result.current.setCount(0, "11");
    });

    expect(result.current.counts[0]).toBe(5);
  });
});
