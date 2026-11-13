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

const loadSecurityHeaders = async ({
  nodeEnv = "production",
  apiBaseUrl = "https://natueve-api.natuportal.org",
  supabaseUrl = "https://example.supabase.co",
  useMsw,
  useDevAssets,
}: HeaderEnv = {}): Promise<Record<string, string>> => {
  vi.resetModules();

  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", apiBaseUrl);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  vi.stubEnv("NEXT_PUBLIC_USE_MSW", useMsw);
  vi.stubEnv("USE_DEV_ASSETS", useDevAssets);
  vi.stubEnv("SITE_NOINDEX", undefined);

  const { default: nextConfig } = await import("../../next.config");
  const rules = (await nextConfig.headers?.()) ?? [];

  expect(rules).toHaveLength(1);
  expect(rules[0].source).toBe("/:path*");

  return Object.fromEntries(
    rules[0].headers.map(({ key, value }) => [key, value]),
  );
};

// CSP を項目ごとに分け、項目名から値の一覧を引けるようにする。
const parseCsp = (policy: string): Record<string, string[]> =>
  Object.fromEntries(
    policy.split("; ").map((directive) => {
      const [name, ...sources] = directive.split(" ");
      return [name, sources];
    }),
  );

const loadCsp = async (env: HeaderEnv = {}) => {
  const headers = await loadSecurityHeaders(env);
  return parseCsp(headers["Content-Security-Policy"]);
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
    });
    expect(headers).toHaveProperty("Content-Security-Policy");
  });

  // next dev は 'unsafe-eval' と HMR が要るため、CSP を付けない。
  it("開発時は CSP を付けず、ほかのヘッダーは付ける", async () => {
    const headers = await loadSecurityHeaders({ nodeEnv: "development" });

    expect(Object.keys(headers).sort()).toEqual(
      ["Referrer-Policy", "X-Content-Type-Options", "X-Frame-Options"].sort(),
    );
  });

  // _headers の /* の規則（次の空行まで）が、ページの CSP 以外のヘッダーと過不足なく一致する。
  it("public/_headers で静的ファイルにも同じ値を付ける", async () => {
    const headers = await loadSecurityHeaders({ nodeEnv: "development" });
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

describe("next.config.ts の CSP", () => {
  it("クリックジャッキングと埋め込み・書き換えを防ぐ", async () => {
    expect(await loadCsp()).toMatchObject({
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "font-src": ["'self'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
    });
  });

  it("'unsafe-eval' を許可しない", async () => {
    const headers = await loadSecurityHeaders();

    expect(headers["Content-Security-Policy"]).not.toContain("unsafe-eval");
  });

  it("本番ビルドの接続先を許可する", async () => {
    const csp = await loadCsp();

    expect(csp["connect-src"]).toEqual([
      "'self'",
      "https://natueve-api.natuportal.org",
      "https://example.supabase.co",
      "https://*.r2.cloudflarestorage.com",
    ]);
    expect(csp["img-src"]).toEqual([
      "'self'",
      "blob:",
      "https://assets.natuportal.org",
      "https://lh3.googleusercontent.com",
    ]);
  });

  // パスや末尾のスラッシュが付いていても、オリジンだけを許可する。
  it("接続先の URL からオリジンだけを取り出す", async () => {
    const csp = await loadCsp({
      apiBaseUrl: "https://natueve-api-stg.natuportal.org/",
      supabaseUrl: "https://example.supabase.co/auth/v1",
    });

    expect(csp["connect-src"]).toContain(
      "https://natueve-api-stg.natuportal.org",
    );
    expect(csp["connect-src"]).toContain("https://example.supabase.co");
  });

  // CI の品質チェックのビルドは接続先を空文字で渡す。
  it("接続先が空文字なら許可に加えない", async () => {
    const csp = await loadCsp({ apiBaseUrl: "", supabaseUrl: "" });

    expect(csp["connect-src"]).toEqual([
      "'self'",
      "https://*.r2.cloudflarestorage.com",
    ]);
  });

  // スキームが抜けた値は URL として解釈されるが、オリジンが "null" になり CSP で通信が止まる。
  it.each([
    ["URL でない値", "not a url"],
    ["スキームが抜けた値", "localhost:8085"],
    ["http(s) 以外のスキーム", "ftp://natueve-api.natuportal.org"],
  ])("接続先が%sならビルドを止める", async (_, apiBaseUrl) => {
    await expect(loadSecurityHeaders({ apiBaseUrl })).rejects.toThrow(
      "NEXT_PUBLIC_API_BASE_URL が URL ではありません。",
    );
  });

  it("USE_DEV_ASSETS=true なら開発用の画像の取得元も許可する", async () => {
    const csp = await loadCsp({ useDevAssets: "true" });

    expect(csp["img-src"]).toContain("https://assets-dev.natuportal.org");
  });

  it("NEXT_PUBLIC_USE_MSW=true ならモックの取得元・接続先も許可する", async () => {
    const csp = await loadCsp({ useMsw: "true" });

    expect(csp["img-src"]).toEqual(
      expect.arrayContaining([
        "https://picsum.photos",
        "https://i.pravatar.cc",
      ]),
    );
    expect(csp["connect-src"]).toContain("https://mock.storage.test");
  });

  // 画像最適化で許可した取得元を、直接読み込むときにも CSP が止めない。
  // スキーム・ポートの書き方は実装に任せ、ホスト名で突き合わせる（実装と同じ関数で期待値を作らない）。
  it("img-src に remotePatterns のホストをすべて含める", async () => {
    const csp = await loadCsp({ useMsw: "true", useDevAssets: "true" });
    const { default: nextConfig } = await import("../../next.config");
    const hostnames = (nextConfig.images?.remotePatterns ?? []).map(
      ({ hostname }) => hostname,
    );
    const imageSourceHostnames = csp["img-src"].map(
      (source) =>
        URL.parse(source.includes("://") ? source : `https://${source}`)
          ?.hostname,
    );

    expect(hostnames.length).toBeGreaterThan(0);
    expect(imageSourceHostnames).toEqual(expect.arrayContaining(hostnames));
  });

  it("フラグが true 以外なら開発用・モックの取得元を許可しない", async () => {
    const csp = await loadCsp({ useMsw: "TRUE", useDevAssets: "false" });
    const policy = Object.values(csp).flat();

    expect(policy).not.toContain("https://assets-dev.natuportal.org");
    expect(policy).not.toContain("https://picsum.photos");
    expect(policy).not.toContain("https://mock.storage.test");
  });
});
