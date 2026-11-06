import { afterEach, describe, expect, it, vi } from "vitest";
import { buildEventDetail } from "@/__tests__/fixtures/event";
import { EventDetailError } from "@/lib/errors";
import { getEventDetail, getEventDetailOrNull } from "@/services/event";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getEventDetail", () => {
  it("404 の場合は status 付きの EventDetailError を送出する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response),
    );

    await expect(getEventDetail("missing")).rejects.toMatchObject({
      name: "EventDetailError",
      status: 404,
    });
    await expect(getEventDetail("missing")).rejects.toBeInstanceOf(
      EventDetailError,
    );
  });

  it("200 の場合はイベント詳細を返す", async () => {
    const event = buildEventDetail();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => event,
      } as Response),
    );

    await expect(getEventDetail(event.id)).resolves.toEqual(event);
  });

  it("指定した signal を fetch に渡す", async () => {
    const event = buildEventDetail();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => event,
    } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await getEventDetail(event.id, controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("signal 未指定時はタイムアウト用の signal を fetch に渡す", async () => {
    const event = buildEventDetail();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => event,
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await getEventDetail(event.id);

    const options = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.signal?.aborted).toBe(false);
  });
});

describe("getEventDetailOrNull", () => {
  it("404 の場合は null を返す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response),
    );

    await expect(getEventDetailOrNull("missing")).resolves.toBeNull();
  });

  it("404 以外のエラーはそのまま送出する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response),
    );

    await expect(getEventDetailOrNull("failed")).rejects.toMatchObject({
      name: "EventDetailError",
      status: 500,
    });
  });

  it("200 の場合はイベント詳細を返す", async () => {
    const event = buildEventDetail();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => event,
      } as Response),
    );

    await expect(getEventDetailOrNull(event.id)).resolves.toEqual(event);
  });
});
