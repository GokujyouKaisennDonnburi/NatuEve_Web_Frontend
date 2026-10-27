// @vitest-environment node
import { mockEventDetails, mockEvents } from "@/mocks/handlers/events/data";
import { describe, expect, it } from "vitest";

describe("イベントのモックデータ", () => {
  it("一覧で返すすべてのイベントに詳細データがある", () => {
    const missingIds = mockEvents
      .filter((event) => !mockEventDetails.has(event.id))
      .map((event) => event.id);

    expect(missingIds).toEqual([]);
  });

  it("報告された ID のイベント詳細と画像が存在する", () => {
    const detail = mockEventDetails.get("00000000-0000-4000-8000-000000000098");

    expect(detail).toBeDefined();
    expect(detail?.imageUrls).toContain(
      "https://picsum.photos/1200/600?random=292",
    );
  });
});
