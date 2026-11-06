import { afterEach, describe, expect, it, vi } from "vitest";
import sitemap, { dynamic } from "@/app/sitemap";
import { SITE_URL } from "@/constants/config";
import { getSitemapEvents } from "@/services/event";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const stubSitemapApi = (events: { id: string; updatedAt: string }[]) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => events,
  } as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("getSitemapEvents", () => {
  it("200 の場合はイベント一覧を返し、認証なしでタイムアウト付きの signal を渡す", async () => {
    const events = [{ id: "a", updatedAt: "2026-01-01T00:00:00Z" }];
    const fetchMock = stubSitemapApi(events);

    await expect(getSitemapEvents()).resolves.toEqual(events);

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/sitemap/events");
    expect(new Headers(options.headers).has("Authorization")).toBe(false);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("失敗時は status を含むメッセージで例外を送出する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({}),
      } as Response),
    );

    await expect(getSitemapEvents()).rejects.toThrow("Status: 429");
  });
});

describe("sitemap", () => {
  it("ビルド時に API を呼ばないよう force-dynamic にする", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("静的ページとイベントの URL を返し、lastModified は API の値と一致する", async () => {
    stubSitemapApi([
      { id: "event-1", updatedAt: "2026-02-03T04:05:06Z" },
      { id: "a/b", updatedAt: "2026-01-01T00:00:00+09:00" },
    ]);

    const result = await sitemap();

    expect(result).toEqual([
      { url: `${SITE_URL}/about` },
      { url: `${SITE_URL}/guideline` },
      { url: `${SITE_URL}/docs` },
      { url: `${SITE_URL}/event-list` },
      {
        url: `${SITE_URL}/event/event-1`,
        lastModified: "2026-02-03T04:05:06Z",
      },
      {
        url: `${SITE_URL}/event/a%2Fb`,
        lastModified: "2026-01-01T00:00:00+09:00",
      },
    ]);
  });

  it("合計が 50,000 URL ちょうどになるよう古いイベントを切り詰める", async () => {
    const events = Array.from({ length: 50_000 }, (_, i) => ({
      id: `event-${i}`,
      updatedAt: "2026-01-01T00:00:00Z",
    }));
    stubSitemapApi(events);

    const result = await sitemap();

    expect(result).toHaveLength(50_000);
    expect(result.at(-1)?.url).toBe(`${SITE_URL}/event/event-49995`);
    expect(result.some((entry) => entry.url.endsWith("/event-49996"))).toBe(
      false,
    );
  });

  it("API 失敗時は例外が伝わる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response),
    );

    await expect(sitemap()).rejects.toThrow("Status: 500");
  });
});
