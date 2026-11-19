import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EVENT_LIST_FETCH_PAGE_SIZE } from "@/constants/config";
import { useMyEvents } from "@/hooks/useMyEvents";
import { fetchMyEvents } from "@/services/event";
import type { MyEventType } from "@/types/event";
import { buildEvent, buildEventListResponse, day } from "./eventListFixtures";

vi.mock("@/services/event", () => ({
  fetchMyEvents: vi.fn(),
}));

const mockFetchMyEvents = vi.mocked(fetchMyEvents);

// マイページ用イベント一覧の仕様を検証する。
// バックエンド（ADR-0012 / ADR-0024）は一覧にキャンセル済みイベントを含め
// counts / totalCount にも含めるため、フロント側で表示制御する。
// - cancelledAt 付きイベントは表示しない（一覧画面 useEventList と挙動を揃える）
// - バックエンドは maxLimit(100) を超える件数を複数ページに分けて返すため、
//   全ページ取得して全件基準で補正できることを検証する
// - 自種別（type）の counts と totalCount から除外件数を差し引いて補正する
// - 他種別の counts は補正しない（ページ側で対応する種別の呼び出しの値に差し替える）
// - キャンセル済みでないイベントの status ラベル・順序には影響しない
describe("useMyEvents", () => {
  beforeEach(() => {
    mockFetchMyEvents.mockReset();
    mockFetchMyEvents.mockResolvedValue(
      buildEventListResponse([], { applied: 0, attended: 0, hosted: 0 }),
    );
  });

  it("cancelledAt 付きイベントは一覧に含めない", async () => {
    mockFetchMyEvents.mockResolvedValue(
      buildEventListResponse(
        [
          buildEvent("cancelled-1", day(5), day(5), {
            cancelledAt: day(-1),
          }),
          buildEvent("visible-1", day(10), day(10)),
          buildEvent("visible-2", day(-5), day(-5)),
        ],
        { applied: 0, attended: 2, hosted: 3 },
      ),
    );

    const { result } = renderHook(() => useMyEvents("hosted"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events.map((event) => event.id)).toEqual([
      "visible-1",
      "visible-2",
    ]);
  });

  it("キャンセル済みイベントの除外件数分、自種別の counts と totalCount を補正する", async () => {
    mockFetchMyEvents.mockResolvedValue(
      buildEventListResponse(
        [
          buildEvent("cancelled-1", day(5), day(5), {
            cancelledAt: day(-1),
          }),
          buildEvent("visible-1", day(10), day(10)),
          buildEvent("visible-2", day(-5), day(-5)),
        ],
        // counts / totalCount にはキャンセル済みが含まれた値が返る
        { applied: 5, attended: 7, hosted: 3 },
        3,
      ),
    );

    const { result } = renderHook(() => useMyEvents("hosted"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.counts).toEqual({
      applied: 5,
      attended: 7,
      hosted: 2,
    });
    expect(result.current.totalCount).toBe(2);
  });

  it.each([
    "applied",
    "attended",
  ] as const satisfies readonly MyEventType[])("type=%s でも自種別の counts と totalCount を補正する", async (type) => {
    mockFetchMyEvents.mockResolvedValue(
      buildEventListResponse(
        [
          buildEvent("cancelled-1", day(5), day(5), {
            cancelledAt: day(-1),
          }),
          buildEvent("visible-1", day(10), day(10)),
          buildEvent("visible-2", day(-5), day(-5)),
        ],
        { applied: 3, attended: 3, hosted: 5 },
        3,
      ),
    );

    const { result } = renderHook(() => useMyEvents(type));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events.map((event) => event.id)).toEqual([
      "visible-1",
      "visible-2",
    ]);
    // 自種別のみ補正され、他種別は backend の値のまま
    expect(result.current.counts).toEqual({
      applied: type === "applied" ? 2 : 3,
      attended: type === "attended" ? 2 : 3,
      hosted: 5,
    });
    expect(result.current.totalCount).toBe(2);
  });

  it("2ページ目にキャンセル済みイベントがある場合も、全ページ取得して counts と totalCount を補正する", async () => {
    const counts = { applied: 0, attended: 3, hosted: 3 };
    mockFetchMyEvents
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

    const { result } = renderHook(() => useMyEvents("hosted"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events.map((event) => event.id)).toEqual([
      "visible-1",
      "visible-2",
    ]);
    expect(result.current.counts).toEqual({
      applied: 0,
      attended: 3,
      hosted: 2,
    });
    expect(result.current.totalCount).toBe(2);
    expect(mockFetchMyEvents).toHaveBeenNthCalledWith(1, "hosted", {
      limit: EVENT_LIST_FETCH_PAGE_SIZE,
      offset: 0,
    });
    expect(mockFetchMyEvents).toHaveBeenNthCalledWith(2, "hosted", {
      limit: EVENT_LIST_FETCH_PAGE_SIZE,
      offset: 2,
    });
  });

  it("キャンセル済みでないイベントの status ラベルには影響しない", async () => {
    mockFetchMyEvents.mockResolvedValue(
      buildEventListResponse(
        [
          // 過去開催は取りやめでなくとも「開催終了(closed)」になる
          buildEvent("ended-1", day(-10), day(-10)),
          buildEvent("upcoming-1", day(30), day(30)),
        ],
        { applied: 0, attended: 2, hosted: 2 },
      ),
    );

    const { result } = renderHook(() => useMyEvents("hosted"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const statusById = new Map(
      result.current.events.map((event) => [event.id, event.status]),
    );
    expect(statusById.get("ended-1")).toBe("closed");
    expect(statusById.get("upcoming-1")).toBe("open");
  });

  it("キャンセル済みイベントが含まれない場合、counts と totalCount を補正しない", async () => {
    mockFetchMyEvents.mockResolvedValue(
      buildEventListResponse(
        [
          buildEvent("ended-1", day(-5), day(-5)),
          buildEvent("upcoming-1", day(10), day(10)),
        ],
        { applied: 0, attended: 2, hosted: 2 },
      ),
    );

    const { result } = renderHook(() => useMyEvents("hosted"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.counts).toEqual({
      applied: 0,
      attended: 2,
      hosted: 2,
    });
    expect(result.current.totalCount).toBe(2);
  });

  it("レスポンスの順序をそのまま表示する", async () => {
    mockFetchMyEvents.mockResolvedValue(
      buildEventListResponse(
        [
          buildEvent("ended-1", day(-10), day(-10)),
          buildEvent("upcoming-1", day(30), day(30)),
        ],
        { applied: 0, attended: 2, hosted: 2 },
      ),
    );

    const { result } = renderHook(() => useMyEvents("hosted"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events.map((event) => event.id)).toEqual([
      "ended-1",
      "upcoming-1",
    ]);
  });
});
