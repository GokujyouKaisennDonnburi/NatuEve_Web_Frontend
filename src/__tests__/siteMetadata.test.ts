// @vitest-environment node
// metadata の設定値だけを検証するため、DOM は使わない。

import { describe, expect, it, vi } from "vitest";
import { metadata as rootMetadata, viewport } from "@/app/layout";
import { generateMetadata as generateEventMetadata } from "@/app/(main)/event/[id]/layout";
import { generateMetadata as generateUserMetadata } from "@/app/(main)/users/[id]/layout";
import { APP_NAME } from "@/constants/config";
import { canonicalMetadata, SITE_OPEN_GRAPH } from "@/utils/metadata";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

describe("root metadata", () => {
  it("theme-color と iOS のホーム画面メタデータを設定する", () => {
    expect(viewport.themeColor).toBe("#ffffff");
    expect(rootMetadata.appleWebApp).toEqual({
      capable: true,
      title: APP_NAME,
      statusBarStyle: "default",
    });
  });

  it("既存の title と OGP を維持する", () => {
    expect(rootMetadata.title).toEqual({
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    });
    expect(rootMetadata.openGraph).toEqual(SITE_OPEN_GRAPH);
  });
});

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

// params はデコード済みのため、エンコードしないと別のパスやクエリとして解決される。
describe.each([
  ["/event/[id]", generateEventMetadata, "/event"],
  ["/users/[id]", generateUserMetadata, "/users"],
])("%s の canonical", (_, generateMetadata, basePath) => {
  it.each([
    ["通常の ID", "abc-123", "abc-123"],
    ["スラッシュと ..", "../../signin", "..%2F..%2Fsignin"],
    ["クエリの区切り", "a?b", "a%3Fb"],
    ["フラグメントの区切り", "a#b", "a%23b"],
  ])("%s", async (_label, id, expected) => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ id }),
    });

    expect(metadata.alternates?.canonical).toBe(`${basePath}/${expected}`);
  });
});
