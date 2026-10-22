import { afterEach, describe, expect, it, vi } from "vitest";
import type { ImageRemotePattern } from "../../next.config";

vi.mock("@opennextjs/cloudflare", () => ({
  initOpenNextCloudflareForDev: vi.fn(),
}));

// next.config.ts の設定値を意図的に固定し、許可パターンの回帰を検出する。
// キー形式: protocol://hostname|port|pathname|search（未設定は ""・"/**"）。
const PRODUCTION_PATTERNS = [
  "https://assets.natuportal.org||/**|",
  "https://lh3.googleusercontent.com||/**|",
];
const MOCK_PATTERNS = [
  "https://picsum.photos||/**|",
  "https://i.pravatar.cc||/**|",
];

const toPatternKey = ({
  protocol,
  hostname,
  port,
  pathname,
  search,
}: ImageRemotePattern) =>
  [
    `${protocol?.replace(/:$/, "") ?? "*"}://${hostname}`,
    port ?? "",
    pathname ?? "/**",
    search ?? "",
  ].join("|");

const originalUseMsw = process.env.NEXT_PUBLIC_USE_MSW;

const loadRemotePatternKeys = async (useMsw?: string): Promise<string[]> => {
  vi.resetModules();

  if (useMsw === undefined) {
    delete process.env.NEXT_PUBLIC_USE_MSW;
  } else {
    process.env.NEXT_PUBLIC_USE_MSW = useMsw;
  }

  const { default: nextConfig } = await import("../../next.config");
  const remotePatterns = nextConfig.images?.remotePatterns ?? [];

  return remotePatterns.map(toPatternKey);
};

afterEach(() => {
  if (originalUseMsw === undefined) {
    delete process.env.NEXT_PUBLIC_USE_MSW;
  } else {
    process.env.NEXT_PUBLIC_USE_MSW = originalUseMsw;
  }
});

describe("next.config.ts の画像取得元", () => {
  // 本番ビルドでは placehold.co・picsum.photos・example.com・i.pravatar.cc を許可しない。
  it.each([
    ["未設定", undefined],
    ["false", "false"],
    ["TRUE", "TRUE"],
    ["空文字", ""],
  ])("NEXT_PUBLIC_USE_MSW が %s なら本番用の取得元だけを許可する", async (_label, useMsw) => {
    expect(new Set(await loadRemotePatternKeys(useMsw))).toEqual(
      new Set(PRODUCTION_PATTERNS),
    );
  });

  it("NEXT_PUBLIC_USE_MSW=true ならモック用の取得元も許可する", async () => {
    expect(new Set(await loadRemotePatternKeys("true"))).toEqual(
      new Set([...PRODUCTION_PATTERNS, ...MOCK_PATTERNS]),
    );
  });
});
