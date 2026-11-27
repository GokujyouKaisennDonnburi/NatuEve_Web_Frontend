import { afterEach, describe, expect, it, vi } from "vitest";
import { buildEventDetail } from "@/__tests__/fixtures/event";
import { EventDetailError, isEventGoneError } from "@/lib/errors";
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

  // 410 は本文に依存せず、HTTP ステータスだけで判定する（ADR-0008）。
  it.each([
    ["エラー形式の本文", async () => ({ error: { code: "any_code" } })],
    [
      "JSON でない本文",
      async () => {
        throw new SyntaxError("Unexpected token");
      },
    ],
  ])("410 の場合は%sでも status 410 の EventDetailError を送出する", async (_, json) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 410, json } as Response),
    );

    const error = await getEventDetail("gone").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(EventDetailError);
    expect(error).toMatchObject({ status: 410 });
    expect(isEventGoneError(error)).toBe(true);
  });

  // API の変更前（200 + cancelledAt）も 410 と同じ扱いにする（ADR-0008）。
  it("200 で cancelledAt 付きの場合は status 410 の EventDetailError を送出する", async () => {
    const event = buildEventDetail({ cancelledAt: "2026-06-25T10:00:00Z" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => event,
      } as Response),
    );

    await expect(getEventDetail(event.id)).rejects.toMatchObject({
      name: "EventDetailError",
      status: 410,
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

  it.each([
    ["410", { ok: false, status: 410, json: async () => ({}) }],
    [
      "200 + cancelledAt",
      {
        ok: true,
        status: 200,
        json: async () =>
          buildEventDetail({ cancelledAt: "2026-06-25T10:00:00Z" }),
      },
    ],
  ])("取りやめ済み（%s）の場合は null を返す", async (_, response) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response as Response));

    await expect(getEventDetailOrNull("gone")).resolves.toBeNull();
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
