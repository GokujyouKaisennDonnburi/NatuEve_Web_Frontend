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

const buildEvent = (
  id: string,
  eventDate: string,
  endDate: string,
): EventListItem => ({
  id,
  createdAt: "2026-01-01T00:00:00+09:00",
  eventDate,
  endDate,
  location: "東京都新宿区",
  profileId: "profile-1",
  title: `イベント ${id}`,
  profile: { id: "profile-1", displayName: "主催者", avatarUrl: "" },
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
// - 「開催日が近い順」では status の強制指定は行わず、終了済みイベントも表示対象にする。
//   表示順序はフロント側で「終了日が過ぎていないイベント → 終了済みイベント」の順に、
//   それぞれ開催日時の昇順で並べ替える（実 API が終了済みを混在して返すため）
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
    // 開催状況はユーザーの明示選択をそのまま優先する
    expect(request.status).toEqual(["upcoming"]);
  });

  it("「投稿が新しい順」の場合は order=desc で、status 未選択なら status をリクエストに含まない", async () => {
    renderHook(() => useEventList({ ...defaultParams, sortBy: "created_at" }));

    await waitFor(() => expect(mockFetchEventList).toHaveBeenCalledTimes(1));

    const request = mockFetchEventList.mock.calls[0][0];
    expect(request.sort).toBe("created_at");
    expect(request.order).toBe("desc");
    expect(request.status).toBeUndefined();
  });

  it("「開催日が近い順」の場合は order=asc で、status 未選択なら status をリクエストに含まない", async () => {
    renderHook(() => useEventList({ ...defaultParams, sortBy: "event_date" }));

    await waitFor(() => expect(mockFetchEventList).toHaveBeenCalledTimes(1));

    const request = mockFetchEventList.mock.calls[0][0];
    expect(request.sort).toBe("event_date");
    expect(request.order).toBe("asc");
    // 終了済みイベントも表示対象のため、status による絞り込みは行わない
    expect(request.status).toBeUndefined();
  });

  it("「開催日が近い順」で開催状況フィルター選択時は選択がそのまま status になる", async () => {
    renderHook(() =>
      useEventList({
        ...defaultParams,
        sortBy: "event_date",
        selectedStatuses: ["upcoming"],
      }),
    );

    await waitFor(() => expect(mockFetchEventList).toHaveBeenCalledTimes(1));

    const request = mockFetchEventList.mock.calls[0][0];
    expect(request.status).toEqual(["upcoming"]);
  });

  it("「開催日が近い順」でも終了済み(ended)の明示選択は ended を含む status でリクエストする", async () => {
    renderHook(() =>
      useEventList({
        ...defaultParams,
        sortBy: "event_date",
        selectedStatuses: ["ended"],
      }),
    );

    await waitFor(() => expect(mockFetchEventList).toHaveBeenCalledTimes(1));

    const request = mockFetchEventList.mock.calls[0][0];
    expect(request.status).toEqual(["ended"]);
  });

  it("「投稿が新しい順」の場合は開催状況フィルターの選択がそのまま status になる", async () => {
    renderHook(() =>
      useEventList({
        ...defaultParams,
        sortBy: "created_at",
        selectedStatuses: ["ended"],
      }),
    );

    await waitFor(() => expect(mockFetchEventList).toHaveBeenCalledTimes(1));

    const request = mockFetchEventList.mock.calls[0][0];
    expect(request.status).toEqual(["ended"]);
  });

  it("「開催日が近い順」では未終了イベントを先頭に、終了済みイベントを末尾にそれぞれ開催日昇順で並べ替える", async () => {
    const day = (days: number) =>
      new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    // API は終了済みを混在して返すため、レスポンス順を意図的にスクランブルする
    mockFetchEventList.mockResolvedValue(
      buildResponse([
        buildEvent("upcoming-2", day(20), day(20)),
        buildEvent("ended-1", day(-10), day(-10)),
        buildEvent("upcoming-1", day(5), day(5)),
        buildEvent("ended-2", day(-5), day(-5)),
      ]),
    );

    const { result } = renderHook(() =>
      useEventList({ ...defaultParams, sortBy: "event_date" }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.events.map((event) => event.id)).toEqual([
      "upcoming-1",
      "upcoming-2",
      "ended-1",
      "ended-2",
    ]);
  });

  it("「投稿が新しい順」ではレスポンスの順序をそのまま表示する", async () => {
    const day = (days: number) =>
      new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    mockFetchEventList.mockResolvedValue(
      buildResponse([
        buildEvent("ended-1", day(-10), day(-10)),
        buildEvent("upcoming-1", day(5), day(5)),
      ]),
    );

    const { result } = renderHook(() =>
      useEventList({ ...defaultParams, sortBy: "created_at" }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.events.map((event) => event.id)).toEqual([
      "ended-1",
      "upcoming-1",
    ]);
  });
});
