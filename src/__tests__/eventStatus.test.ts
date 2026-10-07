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

// 開催中（開始済み・未終了）のイベント。複数日にわたる開催とし、
// 申込期限をどの位置に置いても終了日時と矛盾しないようにしている。
const ONGOING = {
  eventDate: "2026-09-03T09:00:00+09:00",
  endDate: "2026-09-20T18:00:00+09:00",
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

  it("開催前に申込期限を過ぎていれば受付終了", () => {
    expect(
      resolveEventStatus({
        ...UPCOMING,
        applicationDeadline: "2026-09-02T23:59:59+09:00",
      }),
    ).toBe("ended_registration");
  });

  it("開催中（開始済み・未終了）で申込期限を過ぎていれば開催中", () => {
    expect(
      resolveEventStatus({
        eventDate: "2026-09-03T09:00:00+09:00",
        endDate: "2026-09-03T18:00:00+09:00",
        applicationDeadline: "2026-09-02T23:59:59+09:00",
      }),
    ).toBe("ongoing");
  });

  it("開始時刻ちょうどから開催中として扱う", () => {
    // 申込期限は過ぎている前提で、開始が現在時刻と同時なら開催中、1秒後なら開始前の受付終了。
    expect(
      resolveEventStatus({
        eventDate: "2026-09-03T12:00:00+09:00",
        endDate: "2026-09-03T18:00:00+09:00",
        applicationDeadline: "2026-09-02T23:59:59+09:00",
      }),
    ).toBe("ongoing");
    expect(
      resolveEventStatus({
        eventDate: "2026-09-03T12:00:01+09:00",
        endDate: "2026-09-03T18:00:00+09:00",
        applicationDeadline: "2026-09-02T23:59:59+09:00",
      }),
    ).toBe("ended_registration");
  });

  it("開催中でも申込期限が未設定なら受付中", () => {
    expect(resolveEventStatus(ONGOING)).toBe("open");
  });

  it("開催中でも申込期限が8日後の0時以降（日付基準）なら受付中", () => {
    // 期限間近の上限（9/10 23:59:59.999 JST）の1ミリ秒後（9/11 0:00）からは受付中に戻る。
    expect(
      resolveEventStatus({
        ...ONGOING,
        applicationDeadline: "2026-09-11T00:00:00+09:00",
      }),
    ).toBe("open");
  });

  it("開催中でも申込期限が7日以内（未経過）なら期限間近", () => {
    expect(
      resolveEventStatus({
        ...ONGOING,
        applicationDeadline: "2026-09-10T23:59:59+09:00",
      }),
    ).toBe("few_left");
  });

  it("開催中は申込期限をまたぐと期限間近から開催中へ切り替わる", () => {
    // 現在時刻の前後1秒だけで、期限間近と開催中が連続して切り替わる。
    expect(
      resolveEventStatus({
        ...ONGOING,
        applicationDeadline: "2026-09-03T12:00:01+09:00",
      }),
    ).toBe("few_left");
    expect(
      resolveEventStatus({
        ...ONGOING,
        applicationDeadline: "2026-09-03T11:59:59+09:00",
      }),
    ).toBe("ongoing");
  });

  it("終了時刻ちょうどまでは開催中、1秒でも過ぎれば開催終了", () => {
    // 終了日時の判定は「過ぎている」の厳密比較。終了が現在時刻と同時ならまだ開催中。
    expect(
      resolveEventStatus({
        eventDate: "2026-09-03T09:00:00+09:00",
        endDate: "2026-09-03T12:00:00+09:00",
        applicationDeadline: "2026-09-02T23:59:59+09:00",
      }),
    ).toBe("ongoing");
    expect(
      resolveEventStatus({
        eventDate: "2026-09-03T09:00:00+09:00",
        endDate: "2026-09-03T11:59:59+09:00",
        applicationDeadline: "2026-09-02T23:59:59+09:00",
      }),
    ).toBe("closed");
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
    // 上限は 7 日後の 23:59:59.999 JST。その1ミリ秒後（8日後の 0 時）からは受付中に戻る。
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

  it("終了日時が省略された場合は申込期限切れでも開催中にならない", () => {
    // endDate がないと開始と終了が同時刻になり、開始済みなら終了済み（開催終了）になる。
    // 開始前なら通常どおり受付終了で、開催中を経由しない。
    expect(
      resolveEventStatus({
        eventDate: "2026-09-01T09:00:00+09:00",
        applicationDeadline: "2026-08-25T23:59:59+09:00",
      }),
    ).toBe("closed");
    expect(
      resolveEventStatus({
        eventDate: "2026-10-10T09:00:00+09:00",
        applicationDeadline: "2026-09-02T23:59:59+09:00",
      }),
    ).toBe("ended_registration");
  });
});
