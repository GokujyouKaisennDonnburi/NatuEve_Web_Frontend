import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { useEventDetail } from "@/hooks/useEventDetail";
import { getEventDetail } from "@/services/event";
import { getReport } from "@/services/report";

vi.mock("@/services/event", () => ({
  getEventDetail: vi.fn(),
}));
vi.mock("@/services/report", () => ({
  getReport: vi.fn(),
}));

const mockGetEventDetail = vi.mocked(getEventDetail);
const mockGetReport = vi.mocked(getReport);

const buildEvent = (id: string): EventDetailType => ({
  capacity: 10,
  costs: [],
  createdAt: "2026-01-01T00:00:00+09:00",
  participantCount: 1,
  description: "イベントの説明",
  eventDate: "2026-08-01T10:00:00+09:00",
  endDate: "2026-08-01T12:00:00+09:00",
  id,
  imageObjectKeys: [],
  imageFilenames: [],
  imageUrls: [],
  items: [],
  location: "東京都新宿区",
  pdfObjectKeys: [],
  pdfFilenames: [],
  pdfUrls: [],
  profile: {
    id: "profile-1",
    displayName: "主催者",
    avatarUrl: "",
  },
  title: `イベント ${id}`,
  updatedAt: "2026-01-01T00:00:00+09:00",
});

const renderEventDetail = (event: EventDetailType = buildEvent("initial")) =>
  renderHook(() => useEventDetail(event));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetReport.mockResolvedValue(null);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, "visibilityState");
});

describe("useEventDetail", () => {
  it("再取得時に前回のリクエストを abort する", () => {
    const signals: AbortSignal[] = [];
    mockGetEventDetail.mockImplementation((_eventId, signal) => {
      signals.push(signal as AbortSignal);
      return new Promise(() => {});
    });

    const { result } = renderEventDetail();

    act(() => {
      void result.current.refetchEvent();
      void result.current.refetchEvent();
    });

    expect(signals).toHaveLength(2);
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });

  it("アンマウント時に実行中のリクエストを abort する", () => {
    let signal: AbortSignal | undefined;
    mockGetEventDetail.mockImplementation((_eventId, requestSignal) => {
      signal = requestSignal;
      return new Promise(() => {});
    });

    const { result, unmount } = renderEventDetail();

    act(() => {
      void result.current.refetchEvent();
    });
    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it("アンマウント時に実行中のレポート取得を abort する", () => {
    let signal: AbortSignal | undefined;
    mockGetReport.mockImplementation((_eventId, requestSignal) => {
      signal = requestSignal;
      return new Promise(() => {});
    });

    const { unmount } = renderEventDetail();
    expect(mockGetReport).toHaveBeenCalled();
    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it("eventId が変わると前回のレポート取得を abort する", () => {
    const signals: AbortSignal[] = [];
    mockGetReport.mockImplementation((_eventId, requestSignal) => {
      signals.push(requestSignal as AbortSignal);
      return new Promise(() => {});
    });

    const { rerender } = renderHook(({ event }) => useEventDetail(event), {
      initialProps: { event: buildEvent("first") },
    });
    act(() => {
      rerender({ event: buildEvent("second") });
    });

    expect(signals).toHaveLength(2);
    expect(signals[0]?.aborted).toBe(true);
  });

  it("レポート取得のAbortErrorはエラーログに出力しない", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetReport.mockRejectedValue(
      Object.assign(new Error("aborted"), { name: "AbortError" }),
    );

    renderEventDetail();

    await waitFor(() => expect(mockGetReport).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("initialEvent が更新されたら event state を同期する", async () => {
    const initial = buildEvent("initial");
    const { result, rerender } = renderHook(
      ({ event }) => useEventDetail(event),
      {
        initialProps: { event: initial },
      },
    );
    const updated = {
      ...buildEvent("initial"),
      participantCount: 5,
      title: "更新後のイベント",
    };

    rerender({ event: updated });

    await waitFor(() => expect(result.current.event).toEqual(updated));
  });

  it("initialEvent 更新時に実行中の再取得を abort する", () => {
    let signal: AbortSignal | undefined;
    mockGetEventDetail.mockImplementation((_eventId, requestSignal) => {
      signal = requestSignal;
      return new Promise(() => {});
    });

    const { result, rerender } = renderHook(
      ({ event }) => useEventDetail(event),
      { initialProps: { event: buildEvent("initial") } },
    );
    act(() => {
      void result.current.refetchEvent();
    });
    rerender({ event: buildEvent("initial") });

    expect(signal?.aborted).toBe(true);
  });

  it("古いレスポンスは新しい状態を上書きしない", async () => {
    let resolveFirst: ((event: EventDetailType) => void) | undefined;
    let resolveSecond: ((event: EventDetailType) => void) | undefined;
    const first = new Promise<EventDetailType>((resolve) => {
      resolveFirst = resolve;
    });
    const second = new Promise<EventDetailType>((resolve) => {
      resolveSecond = resolve;
    });
    mockGetEventDetail.mockReturnValueOnce(first).mockReturnValueOnce(second);

    const { result } = renderEventDetail();

    let firstRefetch: Promise<void> = Promise.resolve();
    let secondRefetch: Promise<void> = Promise.resolve();
    act(() => {
      firstRefetch = result.current.refetchEvent();
      secondRefetch = result.current.refetchEvent();
    });

    await act(async () => {
      resolveFirst?.(buildEvent("first"));
      await firstRefetch;
    });
    expect(result.current.event.id).toBe("initial");

    await act(async () => {
      resolveSecond?.(buildEvent("second"));
      await secondRefetch;
    });
    expect(result.current.event.id).toBe("second");
  });

  it("AbortError はエラーログに出力しない", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetEventDetail.mockRejectedValue(
      Object.assign(new Error("aborted"), { name: "AbortError" }),
    );

    const { result } = renderEventDetail();

    await act(async () => {
      await result.current.refetchEvent();
    });

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("タブ復帰時は30秒以内の再取得をスキップする", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-03T12:00:00+09:00"));
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    mockGetEventDetail.mockResolvedValue(buildEvent("latest"));

    renderEventDetail();

    expect(mockGetEventDetail).not.toHaveBeenCalled();

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    expect(mockGetEventDetail).not.toHaveBeenCalled();

    vi.setSystemTime(new Date("2026-09-03T12:00:30.001+09:00"));
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    expect(mockGetEventDetail).toHaveBeenCalledTimes(1);

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    expect(mockGetEventDetail).toHaveBeenCalledTimes(1);
  });
});
