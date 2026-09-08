import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDeadlinePassed } from "@/utils/participation";

// 判定は「期限 < 現在時刻」。境界を確実に踏むため現在時刻を固定する。
const NOW = new Date("2026-09-03T12:00:00+09:00");

describe("isDeadlinePassed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("未設定は期限なしとして false を返す", () => {
    expect(isDeadlinePassed(undefined)).toBe(false);
    expect(isDeadlinePassed(null)).toBe(false);
    expect(isDeadlinePassed("")).toBe(false);
  });

  it("日時として読めない値は期限なしとして false を返す", () => {
    expect(isDeadlinePassed("invalid-date")).toBe(false);
    expect(isDeadlinePassed("未定")).toBe(false);
  });

  it("期限を過ぎていれば true を返す", () => {
    expect(isDeadlinePassed("2026-09-03T11:59:59+09:00")).toBe(true);
    expect(isDeadlinePassed("2026-09-02T23:59:59+09:00")).toBe(true);
  });

  it("期限が未来なら false を返す", () => {
    expect(isDeadlinePassed("2026-09-03T12:00:01+09:00")).toBe(false);
    expect(isDeadlinePassed("2026-09-10T23:59:59+09:00")).toBe(false);
  });

  it("現在時刻ちょうどは期限内として false を返す", () => {
    expect(isDeadlinePassed("2026-09-03T12:00:00+09:00")).toBe(false);
  });

  it("表記が違っても同じ時刻なら同じ判定になる", () => {
    // UTC 表記（Z）と JST 表記のどちらで渡しても結果は変わらない
    expect(isDeadlinePassed("2026-09-03T02:59:59Z")).toBe(true);
    expect(isDeadlinePassed("2026-09-03T03:00:01Z")).toBe(false);
  });
});
