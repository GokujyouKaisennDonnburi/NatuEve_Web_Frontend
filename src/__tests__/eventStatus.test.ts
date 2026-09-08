import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveEventStatus } from "@/utils/eventStatus";

// 判定はすべて現在時刻との比較のため、境界を確実に踏むよう現在時刻を固定する。
// 「期限間近」の上限は Asia/Tokyo の日付基準で 7 日後の 23:59:59.999（= 9/10 23:59:59.999 JST）。
const NOW = new Date("2026-09-03T12:00:00+09:00");

// 未終了のイベント。申込期限だけを変えて判定を確かめるための土台。
const UPCOMING = {
  eventDate: "2026-10-10T09:00:00+09:00",
  endDate: "2026-10-10T12:00:00+09:00",
} as const;

describe("resolveEventStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("終了日時を過ぎていれば開催終了", () => {
    expect(
      resolveEventStatus({
        eventDate: "2026-09-01T09:00:00+09:00",
        endDate: "2026-09-01T12:00:00+09:00",
      }),
    ).toBe("closed");
  });

  it("開催終了は受付終了より優先される", () => {
    // 申込期限も終了日時もどちらも過去。開催が終わっている事実を先に伝える。
    expect(
      resolveEventStatus({
        eventDate: "2026-09-01T09:00:00+09:00",
        endDate: "2026-09-01T12:00:00+09:00",
        applicationDeadline: "2026-08-25T23:59:59+09:00",
      }),
    ).toBe("closed");
  });

  it("申込期限を過ぎていれば受付終了", () => {
    expect(
      resolveEventStatus({
        ...UPCOMING,
        applicationDeadline: "2026-09-02T23:59:59+09:00",
      }),
    ).toBe("ended_registration");
  });

  it("開催中（開始済み・未終了）でも申込期限を過ぎていれば受付終了", () => {
    expect(
      resolveEventStatus({
        eventDate: "2026-09-03T09:00:00+09:00",
        endDate: "2026-09-03T18:00:00+09:00",
        applicationDeadline: "2026-09-02T23:59:59+09:00",
      }),
    ).toBe("ended_registration");
  });

  it("申込期限をまたぐと期限間近から受付終了へ切り替わる", () => {
    // 現在時刻の前後1秒だけで、期限間近と受付終了が連続して切り替わる。
    expect(
      resolveEventStatus({
        ...UPCOMING,
        applicationDeadline: "2026-09-03T12:00:01+09:00",
      }),
    ).toBe("few_left");
    expect(
      resolveEventStatus({
        ...UPCOMING,
        applicationDeadline: "2026-09-03T11:59:59+09:00",
      }),
    ).toBe("ended_registration");
  });

  it("申込期限が7日以内なら期限間近", () => {
    // 上限は 7 日後の 23:59:59.999 JST。その1秒後（8日後の 0 時）からは受付中に戻る。
    expect(
      resolveEventStatus({
        ...UPCOMING,
        applicationDeadline: "2026-09-10T23:59:59+09:00",
      }),
    ).toBe("few_left");
    expect(
      resolveEventStatus({
        ...UPCOMING,
        applicationDeadline: "2026-09-11T00:00:00+09:00",
      }),
    ).toBe("open");
  });

  it("申込期限が未設定なら開催終了まで受付中のまま", () => {
    // 締切がないイベントは、開催が翌日でも期限間近・受付終了のどちらにもならない。
    expect(
      resolveEventStatus({
        eventDate: "2026-09-04T09:00:00+09:00",
        endDate: "2026-09-04T12:00:00+09:00",
      }),
    ).toBe("open");
    expect(resolveEventStatus({ ...UPCOMING, applicationDeadline: null })).toBe(
      "open",
    );
  });

  it("日時として読めない申込期限は期限なしとして扱う", () => {
    expect(
      resolveEventStatus({ ...UPCOMING, applicationDeadline: "未定" }),
    ).toBe("open");
  });

  it("終了日時が省略された場合は開催日時を終了日時として扱う", () => {
    expect(resolveEventStatus({ eventDate: "2026-09-01T09:00:00+09:00" })).toBe(
      "closed",
    );
    expect(resolveEventStatus({ eventDate: "2026-10-10T09:00:00+09:00" })).toBe(
      "open",
    );
  });
});
