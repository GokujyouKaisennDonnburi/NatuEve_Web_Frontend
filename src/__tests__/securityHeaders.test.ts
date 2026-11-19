// @vitest-environment node
// next.config.ts のセキュリティヘッダーの設定値だけを検証するため、DOM は使わない。

import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@opennextjs/cloudflare", () => ({
  initOpenNextCloudflareForDev: vi.fn(),
}));

type HeaderEnv = {
  nodeEnv?: string;
  apiBaseUrl?: string;
  supabaseUrl?: string;
  useMsw?: string;
  useDevAssets?: string;
};

// headers() の規則をそのまま返す。検証環境（SITE_NOINDEX=true）では X-Robots-Tag の規則が増える。
const loadHeaderRules = async ({
  nodeEnv = "production",
  apiBaseUrl = "https://natueve-api.natuportal.org",
  supabaseUrl = "https://example.supabase.co",
  useMsw,
  useDevAssets,
  siteNoindex,
}: HeaderEnv & { siteNoindex?: string } = {}) => {
  vi.resetModules();

  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", apiBaseUrl);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  vi.stubEnv("NEXT_PUBLIC_USE_MSW", useMsw);
  vi.stubEnv("USE_DEV_ASSETS", useDevAssets);
  vi.stubEnv("SITE_NOINDEX", siteNoindex);

  const { default: nextConfig } = await import("../../next.config");
  return (await nextConfig.headers?.()) ?? [];
};

const loadSecurityHeaders = async (
  env: HeaderEnv = {},
): Promise<Record<string, string>> => {
  const rules = await loadHeaderRules(env);

  expect(rules).toHaveLength(1);
  expect(rules[0].source).toBe("/:path*");

  return Object.fromEntries(
    rules[0].headers.map(({ key, value }) => [key, value]),
  );
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("next.config.ts のセキュリティヘッダー", () => {
  it("本番ビルドで全ページにセキュリティヘッダーを付ける", async () => {
    const headers = await loadSecurityHeaders();

    expect(headers).toMatchObject({
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      // 段階 2（1 年。#411）。preload は付けない（#386）。
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    });
  });

  // HSTS は localhost を HTTPS に固定しないよう付けない。
  it("開発時は HSTS を付けず、ほかのヘッダーは付ける", async () => {
    const headers = await loadSecurityHeaders({ nodeEnv: "development" });

    expect(Object.keys(headers).sort()).toEqual(
      ["Referrer-Policy", "X-Content-Type-Options", "X-Frame-Options"].sort(),
    );
  });

  // CSP は proxy（src/proxy.ts）だけが付ける（#412。ADR-0005 決定 3）。Workers では headers() の CSP が
  // リクエストヘッダーにも写り、Next.js が nonce を読めなくなるため、どの環境のビルドでも付けない。
  it.each([
    ["本番", {}],
    ["検証環境", { useDevAssets: "true", siteNoindex: "true" }],
    ["MSW", { useMsw: "true" }],
    ["開発時", { nodeEnv: "development" }],
  ])("%sのビルドで、どの規則にも CSP を付けない", async (_, env) => {
    const rules = await loadHeaderRules(env);
    const keys = rules.flatMap(({ headers }) =>
      headers.map(({ key }) => key.toLowerCase()),
    );

    expect(keys).not.toContain("content-security-policy");
    expect(keys).not.toContain("content-security-policy-report-only");
  });

  // _headers の /* の規則（次の空行まで）が、本番のページのヘッダーと過不足なく一致する。
  // _headers は Workers（本番ビルド）でだけ使うため、本番のヘッダーと比べる。
  it("public/_headers で静的ファイルにも同じ値を付ける", async () => {
    const headers = await loadSecurityHeaders();
    const staticHeaders = readFileSync(
      new URL("../../public/_headers", import.meta.url),
      "utf8",
    );
    const [, allPathsRule = ""] =
      staticHeaders.match(/^\/\*\n((?: {2}.+\n?)+)/m) ?? [];
    const allPathsHeaders = Object.fromEntries(
      allPathsRule
        .trim()
        .split("\n")
        .map((line) => line.trim().split(": ")),
    );

    expect(allPathsHeaders).toEqual(headers);
  });
});

// クリックジャッキング対策（#384）。検証環境では規則が増えるため、規則をまたいで確かめる。
describe("next.config.ts の X-Frame-Options", () => {
  it.each([
    ["本番（SITE_NOINDEX 未設定）", undefined],
    ["検証環境（SITE_NOINDEX=true）", "true"],
  ])("%sでも、全ページに DENY を 1 つだけ付ける", async (_, siteNoindex) => {
    const rules = await loadHeaderRules({ siteNoindex });
    const frameOptions = rules.flatMap(({ source, headers }) =>
      headers
        .filter(({ key }) => key.toLowerCase() === "x-frame-options")
        .map(({ value }) => ({ source, value })),
    );

    // 値の異なる X-Frame-Options が重なると、ブラウザによっては無視される。
    expect(frameOptions).toEqual([{ source: "/:path*", value: "DENY" }]);
  });
});
