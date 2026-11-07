// @vitest-environment node
// robots.txt・noindex の設定値だけを検証するため、DOM は使わない。

import { afterEach, describe, expect, it, vi } from "vitest";
import { metadata as aboutMetadata } from "@/app/(main)/about/layout";
import { metadata as comingSoonMetadata } from "@/app/(main)/coming-soon/layout";
import { metadata as docsMetadata } from "@/app/(main)/docs/layout";
import { generateMetadata as generateEventMetadata } from "@/app/(main)/event/[id]/layout";
import { metadata as eventListMetadata } from "@/app/(main)/event-list/layout";
import { metadata as eventPostMetadata } from "@/app/(main)/event-post/layout";
import { metadata as guidelineMetadata } from "@/app/(main)/guideline/layout";
import { metadata as myPageMetadata } from "@/app/(main)/mypage/layout";
import { metadata as reportPostMetadata } from "@/app/(main)/report-post/layout";
import { generateMetadata as generateUserMetadata } from "@/app/(main)/users/[id]/layout";
import { metadata as authCallbackMetadata } from "@/app/auth/callback/layout";
import robots from "@/app/robots";
import { metadata as signInMetadata } from "@/app/signin/layout";
import { SITE_URL } from "@/constants/config";

vi.mock("@opennextjs/cloudflare", () => ({
  initOpenNextCloudflareForDev: vi.fn(),
}));

const params = Promise.resolve({ id: "abc-123" });

describe("robots.txt", () => {
  it("本番の sitemap を記載する", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  // Disallow するとクロールされず、noindex が読まれなくなる。
  it("全体を許可し、Disallow しない", () => {
    expect(robots().rules).toEqual({ userAgent: "*", allow: "/" });
  });
});

describe("検索に載せないページ", () => {
  it.each([
    ["/mypage", myPageMetadata],
    ["/event-post", eventPostMetadata],
    ["/report-post", reportPostMetadata],
    ["/signin", signInMetadata],
    ["/auth/callback", authCallbackMetadata],
    ["/coming-soon", comingSoonMetadata],
  ])("%s に noindex を設定する", (_, metadata) => {
    expect(metadata.robots).toEqual({ index: false });
  });

  it("/users/[id] に noindex を設定する", async () => {
    const metadata = await generateUserMetadata({ params });

    expect(metadata.robots).toEqual({ index: false });
  });
});

describe("検索に載せるページ", () => {
  it.each([
    ["/about", aboutMetadata],
    ["/guideline", guidelineMetadata],
    ["/docs", docsMetadata],
    ["/event-list", eventListMetadata],
  ])("%s に robots を設定しない", (_, metadata) => {
    expect(metadata).not.toHaveProperty("robots");
  });

  it("/event/[id] に robots を設定しない", async () => {
    const metadata = await generateEventMetadata({ params });

    expect(metadata).not.toHaveProperty("robots");
  });
});

describe("検証環境の X-Robots-Tag", () => {
  const originalSiteNoindex = process.env.SITE_NOINDEX;

  const loadHeaders = async (siteNoindex: string | undefined) => {
    vi.resetModules();

    if (siteNoindex === undefined) {
      delete process.env.SITE_NOINDEX;
    } else {
      process.env.SITE_NOINDEX = siteNoindex;
    }

    const { default: nextConfig } = await import("../../next.config");
    return nextConfig.headers?.();
  };

  afterEach(() => {
    if (originalSiteNoindex === undefined) {
      delete process.env.SITE_NOINDEX;
    } else {
      process.env.SITE_NOINDEX = originalSiteNoindex;
    }
  });

  it("SITE_NOINDEX=true のとき全ページに noindex を付ける", async () => {
    await expect(loadHeaders("true")).resolves.toEqual([
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ]);
  });

  it.each([
    ["未設定", undefined],
    ["false", "false"],
    ["空文字", ""],
  ])("SITE_NOINDEX が%sのときは付けない", async (_, value) => {
    await expect(loadHeaders(value)).resolves.toEqual([]);
  });
});
