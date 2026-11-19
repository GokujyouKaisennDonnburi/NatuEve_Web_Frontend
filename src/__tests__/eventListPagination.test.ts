import { describe, expect, it, vi } from "vitest";
import { fetchAllEventPages } from "@/utils/eventListPagination";
import { buildEvent, buildEventListResponse, day } from "./eventListFixtures";

// fetchAllEventPages の仕様を検証する。
// - バックエンドは maxLimit(100) を超える件数を複数ページに分けて返す
// - totalCount に達するまで offset を進めて全ページを1配列にまとめる
// - 空ページが返った場合は打ち切る
// - useEffect のクリーンアップ後（isCancelled が true）は追加取得しない
describe("fetchAllEventPages", () => {
  it("totalCount が1ページ分に収まる場合は1回だけ取得する", async () => {
    const fetchPage = vi.fn().mockResolvedValue(
      buildEventListResponse([buildEvent("event-1", day(5), day(5))], {
        hosted: 1,
      }),
    );

    const { allEvents, firstPage } = await fetchAllEventPages(
      fetchPage,
      () => false,
    );

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(0);
    expect(allEvents.map((event) => event.id)).toEqual(["event-1"]);
    expect(firstPage.totalCount).toBe(1);
  });

  it("totalCount に達するまで offset を進めて全ページを結合する", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(
        buildEventListResponse(
          [
            buildEvent("event-1", day(5), day(5)),
            buildEvent("event-2", day(10), day(10)),
          ],
          { hosted: 3 },
          3,
        ),
      )
      .mockResolvedValueOnce(
        buildEventListResponse(
          [buildEvent("event-3", day(-5), day(-5))],
          { hosted: 3 },
          3,
        ),
      );

    const { allEvents } = await fetchAllEventPages(fetchPage, () => false);

    expect(fetchPage).toHaveBeenNthCalledWith(1, 0);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2);
    expect(allEvents.map((event) => event.id)).toEqual([
      "event-1",
      "event-2",
      "event-3",
    ]);
  });

  it("空ページが返ったら打ち切る", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(
        buildEventListResponse(
          [buildEvent("event-1", day(5), day(5))],
          { hosted: 3 },
          3,
        ),
      )
      .mockResolvedValueOnce(buildEventListResponse([], { hosted: 3 }, 3));

    const { allEvents } = await fetchAllEventPages(fetchPage, () => false);

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(allEvents.map((event) => event.id)).toEqual(["event-1"]);
  });

  it("isCancelled が true の場合は1ページ目のみ取得して追加取得しない", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValue(
        buildEventListResponse(
          [buildEvent("event-1", day(5), day(5))],
          { hosted: 3 },
          3,
        ),
      );

    const { allEvents } = await fetchAllEventPages(fetchPage, () => true);

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(allEvents.map((event) => event.id)).toEqual(["event-1"]);
  });
});
