import { mockEvents } from "@/mocks/handlers/events/data";
import { server } from "@/mocks/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterAll(() => {
  server.close();
});

describe("イベント詳細モックハンドラー", () => {
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
