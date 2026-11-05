import {
  getEventDetailMetadata,
  loadEventDetailOrNotFound,
} from "@/app/(main)/event/[id]/eventDetailMetadata";
import type { EventDetailResponse } from "@/types/event";
import { notFound } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const mockNotFound = vi.mocked(notFound);

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

beforeEach(() => {
  mockNotFound.mockClear();
});

describe("getEventDetailMetadata", () => {
  it("イベントが存在する場合は title / description を返す", async () => {
    const event = buildEvent();
    const loadEvent = vi.fn(async () => event);

    await expect(getEventDetailMetadata(event.id, loadEvent)).resolves.toEqual({
      title: event.title,
      description: event.description,
    });
    expect(loadEvent).toHaveBeenCalledWith(event.id);
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("イベントが存在しない場合は notFound() を呼ぶ", async () => {
    const loadEvent = vi.fn(async () => null);

    await expect(getEventDetailMetadata("missing", loadEvent)).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});

describe("loadEventDetailOrNotFound", () => {
  it("イベントが存在する場合はそのまま返す", async () => {
    const event = buildEvent();
    const loadEvent = vi.fn(async () => event);

    await expect(
      loadEventDetailOrNotFound(event.id, loadEvent),
    ).resolves.toEqual(event);
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});
