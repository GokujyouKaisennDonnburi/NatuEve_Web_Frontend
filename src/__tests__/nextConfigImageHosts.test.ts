// @vitest-environment node

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
const DEVELOPMENT_PATTERNS = ["https://assets-dev.natuportal.org||/**|"];
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

type ImageHostEnv = {
  useMsw?: string;
  useDevAssets?: string;
};

type ImageHostEnvKey = "NEXT_PUBLIC_USE_MSW" | "NEXT_PUBLIC_USE_DEV_ASSETS";

const originalUseMsw = process.env.NEXT_PUBLIC_USE_MSW;
const originalUseDevAssets = process.env.NEXT_PUBLIC_USE_DEV_ASSETS;

const setEnv = (key: ImageHostEnvKey, value: string | undefined) => {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
};

const loadRemotePatternKeys = async ({
  useMsw,
  useDevAssets,
}: ImageHostEnv = {}): Promise<string[]> => {
  vi.resetModules();

  setEnv("NEXT_PUBLIC_USE_MSW", useMsw);
  setEnv("NEXT_PUBLIC_USE_DEV_ASSETS", useDevAssets);

  const { default: nextConfig } = await import("../../next.config");
  const remotePatterns = nextConfig.images?.remotePatterns ?? [];

  return remotePatterns.map(toPatternKey);
};

afterEach(() => {
  setEnv("NEXT_PUBLIC_USE_MSW", originalUseMsw);
  setEnv("NEXT_PUBLIC_USE_DEV_ASSETS", originalUseDevAssets);
});

describe("next.config.ts の画像取得元", () => {
  // 本番ビルドでは開発用・モック用の取得元を許可しない。
  it.each([
    ["未設定", undefined],
    ["false", "false"],
    ["TRUE", "TRUE"],
    ["空文字", ""],
  ])("NEXT_PUBLIC_USE_MSW が %s なら本番用の取得元だけを許可する", async (_label, useMsw) => {
    expect(new Set(await loadRemotePatternKeys({ useMsw }))).toEqual(
      new Set(PRODUCTION_PATTERNS),
    );
  });

  it("NEXT_PUBLIC_USE_MSW=true ならモック用の取得元も許可する", async () => {
    expect(new Set(await loadRemotePatternKeys({ useMsw: "true" }))).toEqual(
      new Set([...PRODUCTION_PATTERNS, ...MOCK_PATTERNS]),
    );
  });

  it.each([
    ["未設定", undefined],
    ["false", "false"],
    ["TRUE", "TRUE"],
    ["空文字", ""],
  ])("NEXT_PUBLIC_USE_DEV_ASSETS が %s なら開発用の取得元を許可しない", async (_label, useDevAssets) => {
    expect(new Set(await loadRemotePatternKeys({ useDevAssets }))).toEqual(
      new Set(PRODUCTION_PATTERNS),
    );
  });

  it("NEXT_PUBLIC_USE_DEV_ASSETS=true なら開発用の取得元も許可する", async () => {
    expect(
      new Set(await loadRemotePatternKeys({ useDevAssets: "true" })),
    ).toEqual(new Set([...PRODUCTION_PATTERNS, ...DEVELOPMENT_PATTERNS]));
  });

  it("開発用と MSW のフラグが両方 true なら両方の取得元も許可する", async () => {
    expect(
      new Set(
        await loadRemotePatternKeys({
          useMsw: "true",
          useDevAssets: "true",
        }),
      ),
    ).toEqual(
      new Set([
        ...PRODUCTION_PATTERNS,
        ...DEVELOPMENT_PATTERNS,
        ...MOCK_PATTERNS,
      ]),
    );
  });
});
