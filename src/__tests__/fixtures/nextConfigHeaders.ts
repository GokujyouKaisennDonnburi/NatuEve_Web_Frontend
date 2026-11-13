import { vi } from "vitest";

// next.config.ts の headers() を SITE_NOINDEX を差し替えて読み込むテスト用ヘルパー。
// SITE_NOINDEX は next.config.ts の読み込み時に評価されるため、毎回モジュールを読み直す。
// 呼び出し側は @opennextjs/cloudflare を vi.mock し（hoisting のため各テストファイルに書く）、
// afterEach で restoreSiteNoindex を呼ぶ。
const originalSiteNoindex = process.env.SITE_NOINDEX;

const setSiteNoindex = (value: string | undefined) => {
  if (value === undefined) {
    delete process.env.SITE_NOINDEX;
  } else {
    process.env.SITE_NOINDEX = value;
  }
};

export const loadNextConfigHeaders = async (
  siteNoindex: string | undefined,
) => {
  vi.resetModules();
  setSiteNoindex(siteNoindex);

  const { default: nextConfig } = await import("../../../next.config");
  return (await nextConfig.headers?.()) ?? [];
};

export const restoreSiteNoindex = () => {
  setSiteNoindex(originalSiteNoindex);
};
