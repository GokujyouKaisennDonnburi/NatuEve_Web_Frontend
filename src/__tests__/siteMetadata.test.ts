// @vitest-environment node
// metadata の設定値だけを検証するため、DOM は使わない。

import { describe, expect, it } from "vitest";
import { canonicalMetadata } from "@/utils/metadata";

describe("canonicalMetadata", () => {
  it("canonical と og:url に同じパスを出す", () => {
    const metadata = canonicalMetadata("/about");

    expect(metadata.alternates?.canonical).toBe("/about");
    expect(metadata.openGraph?.url).toBe("/about");
  });

  // 子の openGraph は親を置き換えるため、サイト共通の値も含める。
  it("サイト共通の OGP を引き継ぐ", () => {
    expect(canonicalMetadata("/about").openGraph).toMatchObject({
      siteName: "なちゅいべ",
      locale: "ja_JP",
      type: "website",
      images: [expect.objectContaining({ url: "/images/og-default.png" })],
    });
  });

  // title・description を持つと、各ページの metadata から引き継がれなくなる。
  it("title・description を固定しない", () => {
    const { openGraph } = canonicalMetadata("/about");

    expect(openGraph).not.toHaveProperty("title");
    expect(openGraph).not.toHaveProperty("description");
  });
});
