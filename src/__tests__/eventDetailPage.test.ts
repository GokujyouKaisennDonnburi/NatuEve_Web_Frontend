import {
  getEventDetailMetadata,
  loadEventDetailOrNotFound,
} from "@/app/(main)/event/[id]/eventDetailMetadata";
import { buildEventDetail } from "@/__tests__/fixtures/event";
import { notFound } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const mockNotFound = vi.mocked(notFound);

beforeEach(() => {
  mockNotFound.mockClear();
});

describe("getEventDetailMetadata", () => {
  it("イベントが存在する場合は title / description を返す", async () => {
    const event = buildEventDetail();
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
    const event = buildEventDetail();
    const loadEvent = vi.fn(async () => event);

    await expect(
      loadEventDetailOrNotFound(event.id, loadEvent),
    ).resolves.toEqual(event);
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});
