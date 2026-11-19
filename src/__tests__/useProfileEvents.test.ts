import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EVENT_LIST_FETCH_PAGE_SIZE } from "@/constants/config";
import { useProfileEvents } from "@/hooks/useProfileEvents";
import { fetchProfileEvents } from "@/services/event";
import type { ProfileEventType } from "@/types/event";
import { buildEvent, buildEventListResponse, day } from "./eventListFixtures";

vi.mock("@/services/event", () => ({
  fetchProfileEvents: vi.fn(),
}));

const mockFetchProfileEvents = vi.mocked(fetchProfileEvents);

// プロフィールページ用イベント一覧の仕様を検証する。
// マイページ（useMyEvents）と同様に、バックエンドが一覧・counts・totalCount に
// キャンセル済みイベントを含めて返すため、フロント側で表示制御する。
// - cancelledAt 付きイベントは表示しない（一覧画面 useEventList と挙動を揃える）
// - バックエンドは maxLimit(100) を超える件数を複数ページに分けて返すため、
//   全ページ取得して全件基準で補正できることを検証する
// - 自種別（type）の counts と totalCount から除外件数を差し引いて補正する
// - 自分以外のユーザー（hosted / attended の両種別）でも同じ挙動になる
describe("useProfileEvents", () => {
  beforeEach(() => {
    mockFetchProfileEvents.mockReset();
    mockFetchProfileEvents.mockResolvedValue(
      buildEventListResponse([], { attended: 0, hosted: 0 }),
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
      buildEventListResponse(
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
    expect(mockFetchProfileEvents).toHaveBeenCalledWith("profile-1", type, {
      limit: EVENT_LIST_FETCH_PAGE_SIZE,
      offset: 0,
    });
  });

  it.each([
    "hosted",
    "attended",
  ] as const satisfies readonly ProfileEventType[])("type=%s の場合、キャンセル済みイベントの除外件数分 counts と totalCount を補正する", async (type) => {
    mockFetchProfileEvents.mockResolvedValue(
      buildEventListResponse(
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

  it("2ページ目にキャンセル済みイベントがある場合も、全ページ取得して counts と totalCount を補正する", async () => {
    const counts = { attended: 3, hosted: 3 };
    mockFetchProfileEvents
      .mockResolvedValueOnce(
        buildEventListResponse(
          [
            buildEvent("visible-1", day(10), day(10)),
            buildEvent("visible-2", day(-5), day(-5)),
          ],
          counts,
          3,
        ),
      )
      .mockResolvedValueOnce(
        buildEventListResponse(
          [
            buildEvent("cancelled-1", day(5), day(5), {
              cancelledAt: day(-1),
            }),
          ],
          counts,
          3,
        ),
      );

    const { result } = renderHook(() =>
      useProfileEvents("profile-1", "hosted"),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events.map((event) => event.id)).toEqual([
      "visible-1",
      "visible-2",
    ]);
    expect(result.current.counts).toEqual({
      attended: 3,
      hosted: 2,
    });
    expect(result.current.totalCount).toBe(2);
    expect(mockFetchProfileEvents).toHaveBeenNthCalledWith(
      1,
      "profile-1",
      "hosted",
      { limit: EVENT_LIST_FETCH_PAGE_SIZE, offset: 0 },
    );
    expect(mockFetchProfileEvents).toHaveBeenNthCalledWith(
      2,
      "profile-1",
      "hosted",
      { limit: EVENT_LIST_FETCH_PAGE_SIZE, offset: 2 },
    );
  });

  it("キャンセル済みでないイベントの status ラベルには影響しない", async () => {
    mockFetchProfileEvents.mockResolvedValue(
      buildEventListResponse(
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
      buildEventListResponse(
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
      buildEventListResponse(
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
