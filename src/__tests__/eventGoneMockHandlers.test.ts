import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { mockEventDetails } from "@/mocks/handlers/events/data";
import { eventDetailHandler } from "@/mocks/handlers/events/detail";
import { cancelledEventIds } from "@/mocks/handlers/events/participation";
import { eventReportHandler } from "@/mocks/handlers/events/report";

// 取りやめ済みのイベントの詳細とレポートが 410 を返すモックの挙動を検証する
// （NatuEve_API#314・ADR-0008）。

const server = setupServer(eventDetailHandler, eventReportHandler);

// 追加のダミーイベント（index 1）。キャンセルされていない。
const EVENT_ID = "00000000-0000-4000-8000-000000000002";
const MISSING_EVENT_ID = "00000000-0000-4000-8000-0000000000ff";

const origin = () => window.location.origin;
const getDetail = (eventId: string) =>
  fetch(`${origin()}/api/v1/events/${eventId}`);
const getReport = (eventId: string) =>
  fetch(`${origin()}/api/v1/events/${eventId}/report`);

let originalCancelledAt: string | null | undefined;

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  server.resetHandlers();
  cancelledEventIds.clear();
  originalCancelledAt = mockEventDetails.get(EVENT_ID)?.cancelledAt;
});

afterEach(() => {
  const detail = mockEventDetails.get(EVENT_ID);
  if (detail) detail.cancelledAt = originalCancelledAt;
});

const markCancelled = {
  // キャンセル API のモックと同じく、取りやめた ID を記録した場合。
  cancelledEventIds: () => {
    cancelledEventIds.add(EVENT_ID);
  },
  // 詳細データに cancelledAt を持つ場合（シードの取りやめ済みイベントなど）。
  cancelledAt: () => {
    const detail = mockEventDetails.get(EVENT_ID);
    if (detail) detail.cancelledAt = "2026-06-25T10:00:00Z";
  },
};

describe("モック: 取りやめ済みのイベント", () => {
  it("取りやめていないイベントは詳細とレポートを 200 で返す", async () => {
    expect((await getDetail(EVENT_ID)).status).toBe(200);
    expect((await getReport(EVENT_ID)).status).toBe(200);
  });

  it.each(
    Object.entries(markCancelled),
  )("%s で取りやめ済みのイベントは詳細が 410 を返す", async (_, mark) => {
    mark();

    const response = await getDetail(EVENT_ID);

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: expect.any(String), message: expect.any(String) },
    });
  });

  it.each(
    Object.entries(markCancelled),
  )("%s で取りやめ済みのイベントはレポートが 410 を返す", async (_, mark) => {
    mark();

    expect((await getReport(EVENT_ID)).status).toBe(410);
  });

  it("存在しないイベントは詳細もレポートも 404 を返す", async () => {
    expect((await getDetail(MISSING_EVENT_ID)).status).toBe(404);
    expect((await getReport(MISSING_EVENT_ID)).status).toBe(404);
  });
});
