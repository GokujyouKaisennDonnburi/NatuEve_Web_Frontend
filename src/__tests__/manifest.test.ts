import manifest from "@/app/manifest";
import { describe, expect, it } from "vitest";

describe("manifest", () => {
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
