import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@opennextjs/cloudflare", () => ({
  initOpenNextCloudflareForDev: vi.fn(),
}));

// next.config.ts の productionImageHosts と揃える。
const PRODUCTION_HOSTS = ["assets.natuportal.org", "lh3.googleusercontent.com"];

// next.config.ts の mockImageHosts と揃える。
const MOCK_HOSTS = ["picsum.photos", "i.pravatar.cc"];

// 本番ビルドで許可してはいけない開発用の取得元。
const DEVELOPMENT_ONLY_HOSTS = [
  "placehold.co",
  "picsum.photos",
  "example.com",
  "i.pravatar.cc",
];

const originalUseMsw = process.env.NEXT_PUBLIC_USE_MSW;

const loadRemotePatternHosts = async (useMsw?: string): Promise<string[]> => {
  vi.resetModules();

  if (useMsw === undefined) {
    delete process.env.NEXT_PUBLIC_USE_MSW;
  } else {
    process.env.NEXT_PUBLIC_USE_MSW = useMsw;
  }

  const { default: nextConfig } = await import("../../next.config");
  const remotePatterns = nextConfig.images?.remotePatterns ?? [];

  return remotePatterns
    .map((pattern) => pattern.hostname)
    .filter((hostname): hostname is string => typeof hostname === "string");
};

afterEach(() => {
  vi.resetModules();

  if (originalUseMsw === undefined) {
    delete process.env.NEXT_PUBLIC_USE_MSW;
  } else {
    process.env.NEXT_PUBLIC_USE_MSW = originalUseMsw;
  }
});

describe("next.config.ts の画像取得元", () => {
  it("NEXT_PUBLIC_USE_MSW が未設定なら本番用の取得元だけを許可する", async () => {
    expect(await loadRemotePatternHosts()).toEqual(PRODUCTION_HOSTS);
  });

  it("NEXT_PUBLIC_USE_MSW=false なら本番用の取得元だけを許可する", async () => {
    expect(await loadRemotePatternHosts("false")).toEqual(PRODUCTION_HOSTS);
  });

  it("本番ビルドでは開発用の取得元を許可しない", async () => {
    const hostnames = await loadRemotePatternHosts("false");

    for (const hostname of DEVELOPMENT_ONLY_HOSTS) {
      expect(hostnames).not.toContain(hostname);
    }
  });

  it("NEXT_PUBLIC_USE_MSW=true ならモック用の取得元も許可する", async () => {
    expect(await loadRemotePatternHosts("true")).toEqual([
      ...PRODUCTION_HOSTS,
      ...MOCK_HOSTS,
    ]);
  });
});
