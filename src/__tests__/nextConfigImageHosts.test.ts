import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@opennextjs/cloudflare", () => ({
  initOpenNextCloudflareForDev: vi.fn(),
}));

// next.config.ts の設定値を意図的に固定し、許可ホストの回帰を検出する。
const PRODUCTION_HOSTS = ["assets.natuportal.org", "lh3.googleusercontent.com"];
const MOCK_HOSTS = ["picsum.photos", "i.pravatar.cc"];

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

  return remotePatterns.map((pattern) => pattern.hostname);
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
  ])("NEXT_PUBLIC_USE_MSW が %s なら本番用の取得元だけを許可する", async (_label, useMsw) => {
    expect(new Set(await loadRemotePatternHosts(useMsw))).toEqual(
      new Set(PRODUCTION_HOSTS),
    );
  });

  it("NEXT_PUBLIC_USE_MSW=true ならモック用の取得元も許可する", async () => {
    expect(new Set(await loadRemotePatternHosts("true"))).toEqual(
      new Set([...PRODUCTION_HOSTS, ...MOCK_HOSTS]),
    );
  });
});
