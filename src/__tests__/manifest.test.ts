import manifest from "@/app/manifest";
import { THEME_COLOR } from "@/constants/config";
import { describe, expect, it } from "vitest";

describe("manifest", () => {
  it("ホーム画面起動と配色のメタデータを宣言する", () => {
    expect(manifest()).toMatchObject({
      name: expect.any(String),
      short_name: expect.any(String),
      description: expect.any(String),
      start_url: "/",
      display: "standalone",
      theme_color: THEME_COLOR,
      background_color: "#f8fafc",
    });
  });

  it("通常アイコンを192pxと512px、maskableアイコンを512pxで宣言する", () => {
    expect(manifest().icons).toEqual([
      {
        src: "/icons/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pwa-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pwa-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ]);
  });
});
