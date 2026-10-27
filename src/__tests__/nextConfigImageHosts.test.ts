// @vitest-environment node
// next.config.ts の設定値だけを検証するため、DOM は使わない。

// Next.js の内部 API。更新で見つからなくなったら、next build の writeImagesManifest と同じく
// picomatch の makeRe（dot: true）で pathname を正規表現にして判定する形に置き換える。
import { matchRemotePattern } from "next/dist/shared/lib/match-remote-pattern";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ImageRemotePattern } from "../../next.config";

vi.mock("@opennextjs/cloudflare", () => ({
  initOpenNextCloudflareForDev: vi.fn(),
}));

// next.config.ts の設定値を意図的に固定し、許可パターンの回帰を検出する。
// キー形式: protocol://hostname|port|pathname|search（未設定は ""・"/**"・"(unset)"）。
// search は完全一致で、"" はクエリなしだけを許可する（末尾 `?` だけは search が空として通る）。
// 未設定のときだけクエリを問わない。
const ASSET_IMAGE_PATHNAME = "+([0-9a-f-]).@(jpg|png)";
const PRODUCTION_PATTERNS = [
  `https://assets.natuportal.org||/natueve/events/images/${ASSET_IMAGE_PATHNAME}|`,
  `https://assets.natuportal.org||/natueve/reports/images/${ASSET_IMAGE_PATHNAME}|`,
];
const DEVELOPMENT_PATTERNS = [
  `https://assets-dev.natuportal.org||/natueve/events/images/${ASSET_IMAGE_PATHNAME}|`,
  `https://assets-dev.natuportal.org||/natueve/reports/images/${ASSET_IMAGE_PATHNAME}|`,
];
const MOCK_PATTERNS = [
  "https://picsum.photos||/**|(unset)",
  "https://i.pravatar.cc||/**|(unset)",
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
    search ?? "(unset)",
  ].join("|");

type ImageHostEnv = {
  useMsw?: string;
  useDevAssets?: string;
};

type ImageHostEnvKey = "NEXT_PUBLIC_USE_MSW" | "USE_DEV_ASSETS";

const originalUseMsw = process.env.NEXT_PUBLIC_USE_MSW;
const originalUseDevAssets = process.env.USE_DEV_ASSETS;

const setEnv = (key: ImageHostEnvKey, value: string | undefined) => {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
};

const loadRemotePatterns = async ({
  useMsw,
  useDevAssets,
}: ImageHostEnv = {}): Promise<ImageRemotePattern[]> => {
  vi.resetModules();

  setEnv("NEXT_PUBLIC_USE_MSW", useMsw);
  setEnv("USE_DEV_ASSETS", useDevAssets);

  const { default: nextConfig } = await import("../../next.config");
  return nextConfig.images?.remotePatterns ?? [];
};

const loadRemotePatternKeys = async (
  env: ImageHostEnv = {},
): Promise<string[]> => (await loadRemotePatterns(env)).map(toPatternKey);

// Next.js の /_next/image と同じ判定（OpenNext もビルド時に同じ glob を正規表現にして使う）で、
// 許可リストが URL を通すかを確かめる。
const isAllowed = (patterns: ImageRemotePattern[], url: string) =>
  patterns.some((pattern) => matchRemotePattern(pattern, new URL(url)));

const IMAGE_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

afterEach(() => {
  setEnv("NEXT_PUBLIC_USE_MSW", originalUseMsw);
  setEnv("USE_DEV_ASSETS", originalUseDevAssets);
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
  ])("USE_DEV_ASSETS が %s なら開発用の取得元を許可しない", async (_label, useDevAssets) => {
    expect(new Set(await loadRemotePatternKeys({ useDevAssets }))).toEqual(
      new Set(PRODUCTION_PATTERNS),
    );
  });

  it("USE_DEV_ASSETS=true なら開発用の取得元も許可する", async () => {
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

describe("next.config.ts の画像取得元の pathname・search の制限", () => {
  // API が返すイベント画像・レポート画像の URL（NatuEve_API の buildFinalKey。JPEG・PNG のみ）。
  // 末尾が `?` だけの URL は、URL の仕様で search が空になるため通る（docs/Deployment.md に記載）。
  it.each([
    `https://assets.natuportal.org/natueve/events/images/${IMAGE_ID}.jpg`,
    `https://assets.natuportal.org/natueve/reports/images/${IMAGE_ID}.png`,
    `https://assets.natuportal.org/natueve/events/images/${IMAGE_ID}.jpg?`,
  ])("本番ビルドで %s を許可する", async (url) => {
    expect(isAllowed(await loadRemotePatterns(), url)).toBe(true);
  });

  it.each([
    [
      "一時領域",
      `https://assets.natuportal.org/natueve/tmp/profile-id/${IMAGE_ID}.jpg`,
    ],
    [
      "PDF",
      `https://assets.natuportal.org/natueve/events/documents/${IMAGE_ID}.pdf`,
    ],
    [
      "natueve 以外のプレフィックス",
      `https://assets.natuportal.org/other/events/images/${IMAGE_ID}.jpg`,
    ],
    [
      "images の下の階層",
      `https://assets.natuportal.org/natueve/events/images/sub/${IMAGE_ID}.jpg`,
    ],
    [
      "親ディレクトリへの移動",
      `https://assets.natuportal.org/natueve/events/images/../../tmp/${IMAGE_ID}.jpg`,
    ],
    [
      "エンコードした / で親ディレクトリへ移動",
      "https://assets.natuportal.org/natueve/events/images/..%2F..%2Ftmp%2Fprofile-id%2Fimage.jpg",
    ],
    [
      "エンコードした \\ で親ディレクトリへ移動",
      "https://assets.natuportal.org/natueve/events/images/..%5C..%5Ctmp%5Cimage.jpg",
    ],
    [
      "JPEG・PNG 以外の拡張子",
      `https://assets.natuportal.org/natueve/events/images/${IMAGE_ID}.gif`,
    ],
    [
      "UUID 以外のファイル名",
      "https://assets.natuportal.org/natueve/events/images/image.jpg",
    ],
    [
      "クエリ付き",
      `https://assets.natuportal.org/natueve/events/images/${IMAGE_ID}.jpg?v=1`,
    ],
    [
      "http",
      `http://assets.natuportal.org/natueve/events/images/${IMAGE_ID}.jpg`,
    ],
    [
      "開発用のドメイン",
      `https://assets-dev.natuportal.org/natueve/events/images/${IMAGE_ID}.jpg`,
    ],
    [
      "Google のプロフィール画像",
      "https://lh3.googleusercontent.com/a/ACg8ocExample=s96-c",
    ],
  ])("本番ビルドで %s の URL を許可しない", async (_label, url) => {
    expect(isAllowed(await loadRemotePatterns(), url)).toBe(false);
  });

  it("USE_DEV_ASSETS=true なら開発用のドメインにも同じ制限を付ける", async () => {
    const patterns = await loadRemotePatterns({ useDevAssets: "true" });

    expect(
      isAllowed(
        patterns,
        `https://assets-dev.natuportal.org/natueve/reports/images/${IMAGE_ID}.png`,
      ),
    ).toBe(true);
    expect(
      isAllowed(
        patterns,
        `https://assets-dev.natuportal.org/natueve/tmp/profile-id/${IMAGE_ID}.jpg`,
      ),
    ).toBe(false);
    expect(
      isAllowed(
        patterns,
        `https://assets-dev.natuportal.org/natueve/events/images/${IMAGE_ID}.jpg?v=1`,
      ),
    ).toBe(false);
  });
});

describe("next.config.ts のモック用の取得元", () => {
  // モックの画像 URL はクエリで画像を切り替えるため、search を絞らない。
  it.each([
    "https://picsum.photos/1200/600?random=1",
    "https://i.pravatar.cc/150?img=1",
  ])("NEXT_PUBLIC_USE_MSW=true なら %s を許可する", async (url) => {
    expect(isAllowed(await loadRemotePatterns({ useMsw: "true" }), url)).toBe(
      true,
    );
  });
});
