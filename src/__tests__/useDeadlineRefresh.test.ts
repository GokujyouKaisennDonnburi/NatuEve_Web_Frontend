import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDeadlineRefresh } from "@/hooks/useDeadlineRefresh";

// フック本体の定数（BOUNDARY_MARGIN_MS / MAX_TIMEOUT_DELAY）と同じ値。
// 実装が変わったときにテストが気づけるよう、あえてここでも明示している。
const BOUNDARY_MARGIN_MS = 1_000;
const MAX_TIMEOUT_DELAY = 2_147_483_647;

const SECOND = 1_000;
const HOUR = 60 * 60 * SECOND;

// 判定はすべて現在時刻との比較のため、境目を確実に踏むよう現在時刻を固定する。
const NOW = new Date("2026-09-03T12:00:00+09:00");

// NOW から指定ミリ秒だけ先の日時を RFC3339（UTC 表記）で返す。
const fromNow = (ms: number): string =>
  new Date(NOW.getTime() + ms).toISOString();

// 再描画の回数を数えながらフックを描画する。
// フックは戻り値を持たないため、描画のたびにコールバックが呼ばれる回数で再描画を観測する。
function renderCounting(deadlines: readonly (string | null | undefined)[]) {
  let renders = 0;
  const view = renderHook(() => {
    renders += 1;
    useDeadlineRefresh(deadlines);
  });
  return { ...view, renders: () => renders };
}

// タイマーを進めると state 更新が走るため、act で包んで再描画まで反映させる。
function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

// globals: false のため testing-library の自動クリーンアップが効かない。
// renderHook も内部で render しているため明示的に片付ける。
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useDeadlineRefresh", () => {
  it("境目（＋マージン）を過ぎるまでは再描画しない", () => {
    const { renders } = renderCounting([fromNow(HOUR)]);

    expect(renders()).toBe(1);

    // 境目ちょうどでは判定が切り替わらないことがあるため、マージン分の余裕を持たせて発火する。
    advance(HOUR);
    expect(renders()).toBe(1);

    // マージンの1ミリ秒手前でもまだ再描画しない。
    advance(BOUNDARY_MARGIN_MS - 1);
    expect(renders()).toBe(1);

    advance(1);
    expect(renders()).toBe(2);
  });

  it("複数の境目を跨ぐたびに1回ずつ再描画し、次の境目へ張り直す", () => {
    // 申込期限 → 開始日時 → 終了日時の順に到来する3つの境目。
    const { renders } = renderCounting([
      fromNow(HOUR),
      fromNow(3 * HOUR),
      fromNow(6 * HOUR),
    ]);

    expect(renders()).toBe(1);
    expect(vi.getTimerCount()).toBe(1);

    // 1つ目の境目（申込期限）。発火は境目の1秒後で、その時点の now から次の境目へ張り直される。
    advance(HOUR + BOUNDARY_MARGIN_MS - 1);
    expect(renders()).toBe(1);
    advance(1);
    expect(renders()).toBe(2);
    expect(vi.getTimerCount()).toBe(1);

    // 2つ目の境目（開始日時）。張り直したタイマーは境目の1秒後に発火する。
    advance(2 * HOUR - 1);
    expect(renders()).toBe(2);
    advance(1);
    expect(renders()).toBe(3);
    expect(vi.getTimerCount()).toBe(1);

    // 3つ目の境目（終了日時）。
    advance(3 * HOUR - 1);
    expect(renders()).toBe(3);
    advance(1);
    expect(renders()).toBe(4);

    // 未来の境目が尽きたら、それ以降はタイマーを張らず再描画も起きない。
    expect(vi.getTimerCount()).toBe(0);
    advance(24 * HOUR);
    expect(renders()).toBe(4);
  });

  it("渡す順序によらず最も近い境目から処理する", () => {
    const { renders } = renderCounting([
      fromNow(6 * HOUR),
      fromNow(HOUR),
      fromNow(3 * HOUR),
    ]);

    advance(HOUR + BOUNDARY_MARGIN_MS);
    expect(renders()).toBe(2);

    advance(2 * HOUR);
    expect(renders()).toBe(3);
  });

  it("過去の値・未設定・日時として読めない値は境目として扱わない", () => {
    const { renders } = renderCounting([
      fromNow(-HOUR),
      null,
      undefined,
      "",
      "未定",
    ]);

    expect(vi.getTimerCount()).toBe(0);

    advance(24 * HOUR);
    expect(renders()).toBe(1);
  });

  it("現在時刻ちょうどの値は未来の境目に含めない", () => {
    const { renders } = renderCounting([fromNow(0)]);

    expect(vi.getTimerCount()).toBe(0);

    advance(24 * HOUR);
    expect(renders()).toBe(1);
  });

  it("無効な値が混ざっていても、有効な未来の境目だけで再描画する", () => {
    const { renders } = renderCounting([
      fromNow(-HOUR),
      null,
      "未定",
      fromNow(2 * HOUR),
    ]);

    expect(vi.getTimerCount()).toBe(1);

    advance(2 * HOUR + BOUNDARY_MARGIN_MS);
    expect(renders()).toBe(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("渡す日時が空ならタイマーを張らない", () => {
    const { renders } = renderCounting([]);

    expect(vi.getTimerCount()).toBe(0);

    advance(24 * HOUR);
    expect(renders()).toBe(1);
  });

  it("setTimeout の上限を超える遠い境目にはタイマーを張らない", () => {
    // 張る遅延は「境目までの時間＋マージン」。これが上限ちょうどまでは張り、1ミリ秒でも超えたら張らない。
    renderCounting([fromNow(MAX_TIMEOUT_DELAY - BOUNDARY_MARGIN_MS)]);
    expect(vi.getTimerCount()).toBe(1);
    cleanup();

    const far = renderCounting([
      fromNow(MAX_TIMEOUT_DELAY - BOUNDARY_MARGIN_MS + 1),
    ]);
    expect(vi.getTimerCount()).toBe(0);

    advance(MAX_TIMEOUT_DELAY);
    expect(far.renders()).toBe(1);
  });

  it("アンマウントするとタイマーを解除する", () => {
    const { unmount } = renderCounting([fromNow(HOUR)]);

    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
