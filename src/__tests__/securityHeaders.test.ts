// @vitest-environment node
// next.config.ts のヘッダーの設定値だけを検証するため、DOM は使わない。

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadNextConfigHeaders as loadHeaders,
  restoreSiteNoindex,
} from "./fixtures/nextConfigHeaders";

vi.mock("@opennextjs/cloudflare", () => ({
  initOpenNextCloudflareForDev: vi.fn(),
}));

describe("クリックジャッキング対策の X-Frame-Options", () => {
  afterEach(restoreSiteNoindex);

  // 本番（SITE_NOINDEX 未設定）と検証環境（true）のどちらでも付くことを確かめる。
  describe.each([
    ["未設定", undefined],
    ["true", "true"],
  ])("SITE_NOINDEX が%sのとき", (_, value) => {
    it("全ページに DENY を付ける", async () => {
      const rules = await loadHeaders(value);

      expect(rules).toContainEqual({
        source: "/:path*",
        headers: [{ key: "X-Frame-Options", value: "DENY" }],
      });
    });

    // 値の異なる X-Frame-Options が重なると、ブラウザによっては無視される。
    it("X-Frame-Options を 1 つだけ付ける", async () => {
      const rules = await loadHeaders(value);

      const frameOptions = rules.flatMap((rule) =>
        rule.headers.filter((header) => header.key === "X-Frame-Options"),
      );
      expect(frameOptions).toHaveLength(1);
    });
  });
});
