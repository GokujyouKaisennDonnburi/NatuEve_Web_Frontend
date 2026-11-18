import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProfileEvents } from "@/hooks/useProfileEvents";
import { fetchProfileEvents } from "@/services/event";
import type {
  EventListItem,
  ProfileEventCounts,
  ProfileEventListResponse,
  ProfileEventType,
} from "@/types/event";

vi.mock("@/services/event", () => ({
  fetchProfileEvents: vi.fn(),
}));

const mockFetchProfileEvents = vi.mocked(fetchProfileEvents);

const buildResponse = (
  events: EventListItem[],
  counts: ProfileEventCounts,
  totalCount = events.length,
): ProfileEventListResponse => ({
  counts,
  events,
  limit: 20,
  offset: 0,
  totalCount,
});

const buildEvent = (
  id: string,
  eventDate: string,
  endDate: string,
  options?: { cancelledAt?: string },
): EventListItem => ({
  id,
  createdAt: "2026-01-01T00:00:00+09:00",
  eventDate,
  endDate,
  location: "東京都新宿区",
  profileId: "profile-1",
  title: `イベント ${id}`,
  profile: { id: "profile-1", displayName: "主催者", avatarUrl: "" },
  ...(options?.cancelledAt ? { cancelledAt: options.cancelledAt } : {}),
});

const day = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

// プロフィールページ用イベント一覧の仕様を検証する。
// マイページ（useMyEvents）と同様に、バックエンドが一覧・counts・totalCount に
// キャンセル済みイベントを含めて返すため、フロント側で表示制御する。
// 自分以外のユーザー（hosted / attended の両種別）でも同じ挙動になることを検証する。
describe("useProfileEvents", () => {
  beforeEach(() => {
    mockFetchProfileEvents.mockReset();
    mockFetchProfileEvents.mockResolvedValue(
      buildResponse([], { attended: 0, hosted: 0 }),
    );
  });

  it("profileId が未指定の場合はイベントを取得しない", async () => {
    const { result } = renderHook(() => useProfileEvents(null, "hosted"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetchProfileEvents).not.toHaveBeenCalled();
    expect(result.current.events).toEqual([]);
    expect(result.current.counts).toBeNull();
    expect(result.current.totalCount).toBe(0);
  });

  it.each([
    "hosted",
    "attended",
  ] as const satisfies readonly ProfileEventType[])("type=%s の場合、cancelledAt 付きイベントは一覧に含めない", async (type) => {
    mockFetchProfileEvents.mockResolvedValue(
      buildResponse(
        [
          buildEvent("cancelled-1", day(5), day(5), {
            cancelledAt: day(-1),
          }),
          buildEvent("visible-1", day(10), day(10)),
          buildEvent("visible-2", day(-5), day(-5)),
        ],
        { attended: 2, hosted: 3 },
      ),
    );

    const { result } = renderHook(() => useProfileEvents("profile-1", type));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events.map((event) => event.id)).toEqual([
      "visible-1",
      "visible-2",
    ]);
    expect(mockFetchProfileEvents).toHaveBeenCalledWith("profile-1", type);
  });

  it.each([
    "hosted",
    "attended",
  ] as const satisfies readonly ProfileEventType[])("type=%s の場合、キャンセル済みイベントの除外件数分 counts と totalCount を補正する", async (type) => {
    mockFetchProfileEvents.mockResolvedValue(
      buildResponse(
        [
          buildEvent("cancelled-1", day(5), day(5), {
            cancelledAt: day(-1),
          }),
          buildEvent("visible-1", day(10), day(10)),
          buildEvent("visible-2", day(-5), day(-5)),
        ],
        // counts / totalCount にはキャンセル済みが含まれた値が返る
        { attended: 3, hosted: 3 },
        3,
      ),
    );

    const { result } = renderHook(() => useProfileEvents("profile-1", type));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 自種別のみ補正され、他種別は backend の値のまま
    expect(result.current.counts).toEqual({
      attended: type === "attended" ? 2 : 3,
      hosted: type === "hosted" ? 2 : 3,
    });
    expect(result.current.totalCount).toBe(2);
  });

  it("キャンセル済みでないイベントの status ラベルには影響しない", async () => {
    mockFetchProfileEvents.mockResolvedValue(
      buildResponse(
        [
          // 過去開催は取りやめでなくとも「開催終了(closed)」になる
          buildEvent("ended-1", day(-10), day(-10)),
          buildEvent("upcoming-1", day(30), day(30)),
        ],
        { attended: 2, hosted: 2 },
      ),
    );

    const { result } = renderHook(() =>
      useProfileEvents("profile-1", "hosted"),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const statusById = new Map(
      result.current.events.map((event) => [event.id, event.status]),
    );
    expect(statusById.get("ended-1")).toBe("closed");
    expect(statusById.get("upcoming-1")).toBe("open");
  });

  it("キャンセル済みイベントが含まれない場合、counts と totalCount を補正しない", async () => {
    mockFetchProfileEvents.mockResolvedValue(
      buildResponse(
        [
          buildEvent("ended-1", day(-5), day(-5)),
          buildEvent("upcoming-1", day(10), day(10)),
        ],
        { attended: 2, hosted: 2 },
      ),
    );

    const { result } = renderHook(() =>
      useProfileEvents("profile-1", "hosted"),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.counts).toEqual({
      attended: 2,
      hosted: 2,
    });
    expect(result.current.totalCount).toBe(2);
  });

  it("レスポンスの順序をそのまま表示する", async () => {
    mockFetchProfileEvents.mockResolvedValue(
      buildResponse(
        [
          buildEvent("ended-1", day(-10), day(-10)),
          buildEvent("upcoming-1", day(30), day(30)),
        ],
        { attended: 2, hosted: 2 },
      ),
    );

    const { result } = renderHook(() =>
      useProfileEvents("profile-1", "hosted"),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events.map((event) => event.id)).toEqual([
      "ended-1",
      "upcoming-1",
    ]);
  });
});
