import { afterEach, describe, expect, it, vi } from "vitest";
import { getReport } from "@/services/report";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const stubFetch = (response: Partial<Response>) =>
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response as Response));

describe("getReport", () => {
  it("404 の場合は null を返す", async () => {
    stubFetch({ ok: false, status: 404, json: async () => ({}) });

    await expect(getReport("no-report")).resolves.toBeNull();
  });

  // 取りやめ済みのイベントは「レポート無し」と同じ扱いにする（ADR-0008）。
  // 410 の判定は HTTP ステータスのみで行い、本文には依存しない。
  it.each([
    ["エラー形式の本文", async () => ({ error: { code: "any_code" } })],
    [
      "JSON でない本文",
      async () => {
        throw new SyntaxError("Unexpected token");
      },
    ],
  ])("410 の場合は%sでも例外を送出せず null を返す", async (_, json) => {
    stubFetch({ ok: false, status: 410, json });

    await expect(getReport("gone")).resolves.toBeNull();
  });

  it("404・410 以外のエラーは例外を送出する", async () => {
    stubFetch({ ok: false, status: 500, json: async () => ({}) });

    await expect(getReport("failed")).rejects.toThrow(
      "レポート取得に失敗しました (Status: 500)",
    );
  });
});
