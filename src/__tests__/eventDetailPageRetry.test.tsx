import EventDetailPage from "@/app/(main)/event/[id]/page";
import { getEventDetail } from "@/services/event";
import { getReport } from "@/services/report";
import type { EventDetailResponse } from "@/types/event";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "event-1" }),
}));

vi.mock("@/services/event", () => ({
  getEventDetail: vi.fn(),
}));

vi.mock("@/services/report", () => ({
  getReport: vi.fn(),
}));

vi.mock("@/components/organisms/EventDetail", () => ({
  default: () => <div data-testid="event-detail" />,
}));

const mockedGetEventDetail = vi.mocked(getEventDetail);
const mockedGetReport = vi.mocked(getReport);

const eventDetail: EventDetailResponse = {
  capacity: 10,
  costs: [],
  createdAt: "2026-01-01T00:00:00+09:00",
  participantCount: 0,
  description: "説明",
  eventDate: "2026-01-01T10:00:00+09:00",
  endDate: "2026-01-01T12:00:00+09:00",
  id: "event-1",
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
  title: "テストイベント",
  updatedAt: "2026-01-01T00:00:00+09:00",
};

beforeEach(() => {
  vi.useFakeTimers();
  mockedGetReport.mockResolvedValue(null);
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe("EventDetailPage のリトライ", () => {
  it("最終リトライで force を指定し、復旧後にレポートを再取得する", async () => {
    for (let index = 0; index < 5; index += 1) {
      mockedGetEventDetail.mockRejectedValueOnce(
        new Error("detail fetch failed"),
      );
    }
    mockedGetEventDetail.mockResolvedValueOnce(eventDetail);

    render(<EventDetailPage />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedGetEventDetail).toHaveBeenCalledTimes(6);
    expect(mockedGetEventDetail.mock.calls[5]?.[1]).toEqual({
      forceMockWorkerRetry: true,
    });
    expect(screen.getByTestId("event-detail")).toBeInTheDocument();

    expect(mockedGetReport).toHaveBeenCalledTimes(2);
    expect(mockedGetReport.mock.calls[1]?.[1]).toEqual({
      forceMockWorkerRetry: true,
    });
  });

  it("アンマウント後はリトライタイマーを実行しない", async () => {
    mockedGetEventDetail.mockRejectedValueOnce(
      new Error("detail fetch failed"),
    );

    const { unmount } = render(<EventDetailPage />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(vi.getTimerCount()).toBe(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(mockedGetEventDetail).toHaveBeenCalledTimes(1);
  });
});
