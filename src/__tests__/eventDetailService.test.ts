import { afterEach, describe, expect, it, vi } from "vitest";
import { getEventDetail } from "@/services/event";
import { EventDetailError } from "@/types/event";
import type { EventDetailResponse } from "@/types/event";

const buildEvent = (): EventDetailResponse => ({
  capacity: 10,
  costs: [],
  createdAt: "2026-01-01T00:00:00+09:00",
  participantCount: 1,
  description: "イベントの説明",
  eventDate: "2026-08-01T10:00:00+09:00",
  endDate: "2026-08-01T12:00:00+09:00",
  id: "00000000-0000-4000-8000-000000000001",
  imageObjectKeys: [],
  imageFilenames: [],
  imageUrls: [],
  items: [],
  location: "東京都新宿区",
  pdfObjectKeys: [],
  pdfFilenames: [],
  pdfUrls: [],
  profile: {
    id: "profile-1",
    displayName: "主催者",
    avatarUrl: "",
  },
  title: "イベントタイトル",
  updatedAt: "2026-01-01T00:00:00+09:00",
});

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
    const event = buildEvent();
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
});
