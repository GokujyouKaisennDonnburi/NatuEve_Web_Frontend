import manifest from "@/app/manifest";
import { describe, expect, it } from "vitest";

describe("manifest", () => {
  it("PWAアイコンを192pxと512pxで宣言する", () => {
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
    ]);
  });
});
