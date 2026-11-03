import { server } from "@/mocks/server";
import { MOCK_AUTH_SESSION } from "@/services/mockAuth";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterAll(() => {
  server.close();
});

describe("イベント作成モックハンドラー", () => {
  it("画像付きイベントを作成すると、詳細でR2キーと表示URLを返す", async () => {
    const createResponse = await fetch(
      `${window.location.origin}/api/v1/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MOCK_AUTH_SESSION.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "作成テストイベント",
          description: "説明",
          location: "東京都新宿区",
          eventDate: "2026-11-01T10:00:00+09:00",
          costs: [{ category: "大人", cost: 1000 }],
          imageObjectKeys: ["tmp/events/uploaded-image"],
          imageFilenames: ["test.jpg"],
        }),
      },
    );

    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { id: string };

    const detailResponse = await fetch(
      `${window.location.origin}/api/v1/events/${created.id}`,
    );
    expect(detailResponse.status).toBe(200);

    const detail = (await detailResponse.json()) as {
      imageObjectKeys?: string[];
      imageUrls?: string[];
    };

    expect(detail.imageObjectKeys).toHaveLength(1);
    expect(detail.imageObjectKeys?.[0]).toMatch(
      /^natueve\/events\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/,
    );
    expect(detail.imageUrls).toHaveLength(1);
    expect(detail.imageUrls?.[0]).toMatch(
      /^https:\/\/picsum\.photos\/1200\/600\?random=\d+$/,
    );
  });
});
