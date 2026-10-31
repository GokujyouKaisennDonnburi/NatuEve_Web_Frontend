import { mockEventDetails, mockEvents } from "@/mocks/handlers/events/data";
import { server } from "@/mocks/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterAll(() => {
  server.close();
});

describe("イベント詳細モックハンドラー", () => {
  it("imageObjectKeys は R2 のキー形式で、表示URLを含まない", () => {
    const keyPattern =
      /^natueve\/events\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png)$/;

    for (const detail of mockEventDetails.values()) {
      expect(detail.imageObjectKeys?.length ?? 0).toBeGreaterThan(0);

      for (const key of detail.imageObjectKeys ?? []) {
        expect(key, detail.id).toMatch(keyPattern);
      }
    }
  });

  it("一覧で返すすべてのイベントについて 200 と画像URLを返す", async () => {
    for (const event of mockEvents) {
      const response = await fetch(
        `${window.location.origin}/api/v1/events/${encodeURIComponent(event.id)}`,
      );

      expect(response.status, event.id).toBe(200);

      const body = (await response.json()) as { imageUrls?: string[] };
      expect(
        body.imageUrls?.some((url) => url.startsWith("https://picsum.photos/")),
        event.id,
      ).toBe(true);
    }
  });
});
