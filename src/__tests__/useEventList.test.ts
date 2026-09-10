import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEventList } from "@/hooks/useEventList";
import { fetchEventList } from "@/services/event";
import type { EventListItem, EventListResponse } from "@/types/event";

vi.mock("@/services/event", () => ({
  fetchEventList: vi.fn(),
}));

const mockFetchEventList = vi.mocked(fetchEventList);

const buildResponse = (
  events: EventListItem[] = [],
  totalCount = events.length,
): EventListResponse => ({
  events,
  limit: 15,
  offset: 0,
  totalCount,
});

const defaultParams: Parameters<typeof useEventList>[0] = {
  currentPage: 1,
  sortBy: "created_at",
  searchQuery: "",
  selectedTagIds: [],
  selectedStatuses: [],
  prefectures: [],
  cities: [],
  itemsPerPage: 15,
};

// 検索ロジックの仕様を検証する。
// - 検索クエリが空・空白のみの場合は keywords なしの通常の一覧取得になる
// - 検索クエリがある場合は空白区切りで keywords 化して取得する
// - ソート・絞り込み・ページネーションによる再取得は従来どおり動作する
describe("useEventList", () => {
  beforeEach(() => {
    mockFetchEventList.mockReset();
    mockFetchEventList.mockResolvedValue(buildResponse());
  });

  it("検索クエリが空の場合、keywords を含まないリクエストで一覧を取得する", async () => {
    renderHook(() => useEventList(defaultParams));

    await waitFor(() => expect(mockFetchEventList).toHaveBeenCalledTimes(1));

    const request = mockFetchEventList.mock.calls[0][0];
    expect(request.keywords).toBeUndefined();
  });

  it("検索クエリがある場合、空白区切り（半角・全角）で keywords 化してリクエストする", async () => {
    renderHook(() =>
      useEventList({ ...defaultParams, searchQuery: "ホタル  干潟　東京" }),
    );

    await waitFor(() => expect(mockFetchEventList).toHaveBeenCalledTimes(1));

    const request = mockFetchEventList.mock.calls[0][0];
    expect(request.keywords).toEqual(["ホタル", "干潟", "東京"]);
  });

  it("空白のみの検索クエリは keywords なしの通常の一覧取得になる", async () => {
    renderHook(() => useEventList({ ...defaultParams, searchQuery: "  　 " }));

    await waitFor(() => expect(mockFetchEventList).toHaveBeenCalledTimes(1));

    const request = mockFetchEventList.mock.calls[0][0];
    expect(request.keywords).toBeUndefined();
  });

  it("ページネーション遷移時にも従来どおり再取得される", async () => {
    const { rerender } = renderHook(
      ({ currentPage }: { currentPage: number }) =>
        useEventList({ ...defaultParams, currentPage }),
      { initialProps: { currentPage: 1 } },
    );

    await waitFor(() => expect(mockFetchEventList).toHaveBeenCalledTimes(1));

    rerender({ currentPage: 2 });

    await waitFor(() => expect(mockFetchEventList).toHaveBeenCalledTimes(2));
    expect(mockFetchEventList.mock.calls[1][0].offset).toBe(15);
  });

  it("絞り込み・ソートの変更時にも従来どおり再取得される", async () => {
    const { rerender } = renderHook(
      (params: Parameters<typeof useEventList>[0]) => useEventList(params),
      {
        initialProps: defaultParams,
      },
    );

    await waitFor(() => expect(mockFetchEventList).toHaveBeenCalledTimes(1));

    rerender({
      ...defaultParams,
      sortBy: "event_date",
      selectedTagIds: ["tag-1"],
      selectedStatuses: ["upcoming"],
    });

    await waitFor(() => expect(mockFetchEventList).toHaveBeenCalledTimes(2));
    const request = mockFetchEventList.mock.calls[1][0];
    expect(request.sort).toBe("event_date");
    expect(request.tagIds).toEqual(["tag-1"]);
    expect(request.status).toEqual(["upcoming"]);
  });
});
