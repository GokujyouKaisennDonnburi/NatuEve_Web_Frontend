// @vitest-environment node
// CSP ヘッダー文字列だけを検証するため、DOM は使わない。

import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import ts from "typescript";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCspHeader, buildTrustedTypesCspHeader } from "../lib/csp";
import { proxy } from "../proxy";

// remotePatterns との突き合わせで next.config.ts を読み込むため、読み込み時の初期化を止める。
vi.mock("@opennextjs/cloudflare", () => ({
  initOpenNextCloudflareForDev: vi.fn(),
}));

// env を意図的に固定し、許可オリジンの回帰を検出するための差し替えヘルパー。
// nextConfigImageHosts.test.ts と同じ体裁で、テスト後に元へ戻す。
type EnvKey =
  | "NEXT_PUBLIC_USE_MSW"
  | "USE_DEV_ASSETS"
  | "NEXT_PUBLIC_API_BASE_URL"
  | "NEXT_PUBLIC_SUPABASE_URL";

const ORIGINAL_ENV: Partial<Record<EnvKey, string | undefined>> = {
  NEXT_PUBLIC_USE_MSW: process.env.NEXT_PUBLIC_USE_MSW,
  USE_DEV_ASSETS: process.env.USE_DEV_ASSETS,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
};

const setEnv = (key: EnvKey, value: string | undefined) => {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
};

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    setEnv(key as EnvKey, value);
  }
});

// CSP から「ディレクティブ名」のソース列を取り出す。
const directiveSources = (csp: string, name: string) => {
  const directive = csp
    .split("; ")
    .find((entry) => entry.startsWith(`${name} `));
  if (!directive) {
    return null;
  }
  return directive.split(" ").slice(1);
};

const NONCE = "ABCD1234/base64==";

describe("buildCspHeader", () => {
  it("本番では script-src に nonce と strict-dynamic を付け、unsafe-inline・unsafe-eval を含まない", () => {
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });

    const scriptSrc = directiveSources(csp, "script-src");
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).toContain(`'nonce-${NONCE}'`);
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it("dev では React のデバッグ用に script-src へ unsafe-eval を足す", () => {
    const csp = buildCspHeader({ nonce: NONCE, isDev: true });

    expect(directiveSources(csp, "script-src")).toContain("'unsafe-eval'");
  });

  it("nonce の CSP には Trusted Types のディレクティブを含めない", () => {
    // Trusted Types は Turbopack ランタイムの既知の違反（vercel/next.js#101261）を
    // 強制しないよう、別の Report-Only ヘッダー（buildTrustedTypesCspHeader）で観察する。
    // enforce の CSP に含めないことで、#412 の切替を上流の修正待ちで止めない。
    for (const isDev of [false, true]) {
      const csp = buildCspHeader({ nonce: NONCE, isDev });

      expect(csp).not.toContain("require-trusted-types-for");
      expect(csp).not.toContain("trusted-types");
    }
  });

  it("isReportOnly のときは Report-Only で無視される upgrade-insecure-requests を外す", () => {
    const csp = buildCspHeader({
      nonce: NONCE,
      isDev: false,
      isReportOnly: true,
    });

    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("nonce はヘッダー内に script-src の 1 か所だけ現れる", () => {
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });

    expect(
      csp.match(new RegExp(NONCE.replace(/[+/=]/g, "\\$&"), "g")),
    ).toHaveLength(1);
  });

  it("既定のディレクティブを揃えて付ける", () => {
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });

    expect(directiveSources(csp, "default-src")).toEqual(["'self'"]);
    expect(directiveSources(csp, "style-src")).toEqual([
      "'self'",
      "'unsafe-inline'",
    ]);
    expect(directiveSources(csp, "font-src")).toEqual(["'self'"]);
    expect(directiveSources(csp, "object-src")).toEqual(["'none'"]);
    expect(directiveSources(csp, "base-uri")).toEqual(["'self'"]);
    expect(directiveSources(csp, "form-action")).toEqual(["'self'"]);
    expect(directiveSources(csp, "frame-ancestors")).toEqual(["'none'"]);
    expect(csp.endsWith("upgrade-insecure-requests")).toBe(true);
  });

  it("本番の画像取得元を img-src に含める", () => {
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });

    const imgSrc = directiveSources(csp, "img-src");
    expect(imgSrc).toContain("'self'");
    expect(imgSrc).toContain("data:");
    expect(imgSrc).toContain("blob:");
    expect(imgSrc).toContain("https://assets.natuportal.org");
    expect(imgSrc).toContain("https://lh3.googleusercontent.com");
  });

  it("本番では dev 専用の取得元・登録先を含めない", () => {
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });

    const imgSrc = directiveSources(csp, "img-src");
    expect(imgSrc).not.toContain("https://assets-dev.natuportal.org");
    expect(imgSrc).not.toContain("https://picsum.photos");
    expect(imgSrc).not.toContain("https://i.pravatar.cc");
    expect(directiveSources(csp, "worker-src")).toBeNull();
    expect(directiveSources(csp, "connect-src")).not.toContain("ws:");
  });

  it("USE_DEV_ASSETS=true では検証環境の R2 を img-src に足す", () => {
    setEnv("USE_DEV_ASSETS", "true");
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });

    expect(directiveSources(csp, "img-src")).toContain(
      "https://assets-dev.natuportal.org",
    );
  });

  it("NEXT_PUBLIC_USE_MSW=true ではモック画像の取得元を img-src に足す", () => {
    setEnv("NEXT_PUBLIC_USE_MSW", "true");
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });

    const imgSrc = directiveSources(csp, "img-src");
    expect(imgSrc).toContain("https://picsum.photos");
    expect(imgSrc).toContain("https://i.pravatar.cc");
  });

  // 画像最適化（next.config.ts の remotePatterns）で許可した取得元を、直接読み込むときにも CSP が止めない
  // （ADR-0005 決定 1）。#412 で next.config.ts の CSP を外したため、ここで proxy の CSP と突き合わせる。
  // next.config.ts に直接足したホストも見つけられるよう、読み込んだ設定の remotePatterns と比べる。
  // スキーム・ポートの書き方は実装に任せ、ホスト名で突き合わせる（実装と同じ関数で期待値を作らない）。
  it("img-src に remotePatterns のホストをすべて含める", async () => {
    setEnv("USE_DEV_ASSETS", "true");
    setEnv("NEXT_PUBLIC_USE_MSW", "true");
    vi.resetModules();
    const { default: nextConfig } = await import("../../next.config");
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });
    const hostnames = (nextConfig.images?.remotePatterns ?? []).map(
      ({ hostname }) => hostname,
    );
    const imageSourceHostnames = (directiveSources(csp, "img-src") ?? []).map(
      (source) => URL.parse(source)?.hostname,
    );

    expect(hostnames.length).toBeGreaterThan(0);
    expect(imageSourceHostnames).toEqual(expect.arrayContaining(hostnames));
  });

  it("NEXT_PUBLIC_USE_MSW=true ではモックの署名付き URL の直 PUT 先を connect-src に足す", () => {
    setEnv("NEXT_PUBLIC_USE_MSW", "true");
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });

    expect(directiveSources(csp, "connect-src")).toContain(
      "https://mock.storage.test",
    );
  });

  it.each([
    ["false", "false"],
    ["TRUE", "TRUE"],
    ["空文字", ""],
  ])("NEXT_PUBLIC_USE_MSW・USE_DEV_ASSETS が%sではモック・開発用の取得元と直 PUT 先を含めない", (_, value) => {
    setEnv("NEXT_PUBLIC_USE_MSW", value);
    setEnv("USE_DEV_ASSETS", value);
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });

    for (const name of ["img-src", "connect-src"]) {
      const sources = directiveSources(csp, name);
      expect(sources).not.toBeNull();
      expect(sources).not.toContain("https://picsum.photos");
      expect(sources).not.toContain("https://i.pravatar.cc");
      expect(sources).not.toContain("https://mock.storage.test");
      expect(sources).not.toContain("https://assets-dev.natuportal.org");
    }
  });

  it("connect-src に API と Supabase のオリジンを足す", () => {
    setEnv("NEXT_PUBLIC_API_BASE_URL", "https://natueve-api.natuportal.org");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });

    const connectSrc = directiveSources(csp, "connect-src");
    expect(connectSrc).toContain("'self'");
    expect(connectSrc).toContain("https://natueve-api.natuportal.org");
    expect(connectSrc).toContain("https://example.supabase.co");
  });

  it("API・Supabase の env が未設定・不正値でも connect-src に載せず壊れない", () => {
    setEnv("NEXT_PUBLIC_API_BASE_URL", "");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-url");
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });

    const connectSrc = directiveSources(csp, "connect-src");
    // R2 の直 PUT 先は env に依らないため常に載る。
    expect(connectSrc).toEqual([
      "'self'",
      "https://assets.natuportal.org",
      "https://*.r2.cloudflarestorage.com",
    ]);
  });

  it("非階層スキーム（data: など）は origin が null にならないよう除外する", () => {
    setEnv("NEXT_PUBLIC_API_BASE_URL", "data:text/plain,x");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "javascript:alert(1)");
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });

    const connectSrc = directiveSources(csp, "connect-src");
    expect(connectSrc).not.toContain("null");
    expect(connectSrc).not.toContain("data:");
    expect(connectSrc).not.toContain("javascript:");
  });

  it("connect-src には presign の署名付き PUT 先（R2 の S3 API エンドポイント）を含める", () => {
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });

    expect(directiveSources(csp, "connect-src")).toContain(
      "https://*.r2.cloudflarestorage.com",
    );
  });

  it("connect-src には署名付き URL の直 PUT 先（R2 の公開ドメイン）も含める", () => {
    const csp = buildCspHeader({ nonce: NONCE, isDev: false });

    expect(directiveSources(csp, "connect-src")).toContain(
      "https://assets.natuportal.org",
    );
  });

  it("dev では HMR の WebSocket と MSW の Service Worker を許可する", () => {
    const csp = buildCspHeader({ nonce: NONCE, isDev: true });

    const connectSrc = directiveSources(csp, "connect-src");
    expect(connectSrc).toContain("ws:");
    expect(connectSrc).toContain("wss:");
    expect(directiveSources(csp, "worker-src")).toEqual(["'self'"]);
  });
});

describe("proxy", () => {
  it("応答とリクエストの両方に同じ CSP ヘッダーを設定する", () => {
    const request = new NextRequest(
      "https://natueve-web.natuportal.org/event-list",
    );
    const response = proxy(request);

    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toBeTruthy();
    expect(csp).toContain("script-src 'self' 'nonce-");
    // NextResponse.next({ request: { headers } }) は、渡した request 側のヘッダーを
    // x-middleware-request-<名前> として応答に載せる。Next.js の proxy は
    // request 側のヘッダーを読んでレンダリングする script / style に nonce を
    // 付けるため、応答のヘッダーだけでなく request 側も確かめる。
    expect(
      response.headers.get("x-middleware-request-content-security-policy"),
    ).toBe(csp);
  });

  // 本番・検証環境の wrangler.jsonc の値（#412）。
  it("CSP_REPORT_ONLY=false では enforce のヘッダー名になる", () => {
    const original = process.env.CSP_REPORT_ONLY;
    process.env.CSP_REPORT_ONLY = "false";
    try {
      const response = proxy(
        new NextRequest("https://natueve-web.natuportal.org/event-list"),
      );

      const csp = response.headers.get("Content-Security-Policy");
      expect(csp).toContain("script-src 'self' 'nonce-");
      expect(csp).toContain("upgrade-insecure-requests");
      // Report-Only のヘッダーには Trusted Types だけが載る（#415）。
      expect(response.headers.get("Content-Security-Policy-Report-Only")).toBe(
        "require-trusted-types-for 'script'; trusted-types nextjs",
      );
    } finally {
      if (original === undefined) {
        delete process.env.CSP_REPORT_ONLY;
      } else {
        process.env.CSP_REPORT_ONLY = original;
      }
    }
  });

  it("CSP_REPORT_ONLY=true では Report-Only ヘッダー名になる", () => {
    const original = process.env.CSP_REPORT_ONLY;
    process.env.CSP_REPORT_ONLY = "true";
    try {
      const response = proxy(
        new NextRequest("https://natueve-web.natuportal.org/event-list"),
      );

      const reportOnly = response.headers.get(
        "Content-Security-Policy-Report-Only",
      );
      expect(response.headers.get("Content-Security-Policy")).toBeNull();
      // Trusted Types（#415）を同じヘッダー名で append するため、同じ名前のヘッダーが
      // 2 つ並び、get() はカンマ区切りで返る。nonce の CSP と Trusted Types の両方が載る。
      expect(reportOnly).toContain("script-src 'self' 'nonce-");
      expect(reportOnly).toContain(
        "require-trusted-types-for 'script'; trusted-types nextjs",
      );
      // Report-Only のときも request 側のヘッダー名を揃える。Next.js の nonce 抽出は
      // Report-Only のヘッダーも対象である（get-script-nonce-from-header.js）ため、
      // request 側に載っていないと Report-Only 時に script への nonce 付与が止まる。
      // Trusted Types のヘッダーは response にしか載らない（request 側は nonce 抽出に不要）。
      const requestCsp = response.headers.get(
        "x-middleware-request-content-security-policy-report-only",
      );
      expect(requestCsp).toContain("script-src 'self' 'nonce-");
      expect(requestCsp).not.toContain("require-trusted-types-for");
    } finally {
      if (original === undefined) {
        delete process.env.CSP_REPORT_ONLY;
      } else {
        process.env.CSP_REPORT_ONLY = original;
      }
    }
  });

  it("Trusted Types を nonce の CSP とは別の Report-Only ヘッダーで付ける", () => {
    // proxy() は NODE_ENV=test で動くため dev 扱いにならず、ヘッダーが付く。
    const response = proxy(
      new NextRequest("https://natueve-web.natuportal.org/event-list"),
    );

    // enforce の CSP（Content-Security-Policy）には含めず、別の Report-Only ヘッダーにする。
    // Turbopack ランタイムの既知の違反（vercel/next.js#101261）を強制しないため。
    const trustedTypes = response.headers.get(
      "Content-Security-Policy-Report-Only",
    );
    expect(trustedTypes).toBe(
      "require-trusted-types-for 'script'; trusted-types nextjs",
    );
  });
});

describe("buildTrustedTypesCspHeader", () => {
  it("本番・検証では require-trusted-types-for と trusted-types（許可ポリシー名 nextjs）を返す", () => {
    expect(buildTrustedTypesCspHeader({ isDev: false })).toBe(
      "require-trusted-types-for 'script'; trusted-types nextjs",
    );
  });

  it("dev では Trusted Types を無効にする", () => {
    // React DevTools 等がシンクを使うため、違反で開発が止まらないようにする（#415 の AC）。
    expect(buildTrustedTypesCspHeader({ isDev: true })).toBeNull();
  });
});

// vars にない変数はビルド時に読んだ .env 系ファイルの値で埋まる（OpenNext の populateProcessEnv）ため、
// 安全側の値も "false" と明示している（#412）。
describe("wrangler.jsonc の実行時変数", () => {
  type WranglerVars = { vars?: Record<string, string> };
  // 行末・ブロックのコメントや末尾のカンマがあっても読めるよう、TypeScript の JSONC の読み込みを使う。
  const { config, error } = ts.parseConfigFileTextToJson(
    "wrangler.jsonc",
    readFileSync(new URL("../../wrangler.jsonc", import.meta.url), "utf8"),
  );
  // 読めなかったときも下の it.each の表を作れるよう、空のオブジェクトにして「読める」のテストで落とす。
  const wrangler = (config ?? {}) as WranglerVars & {
    env?: Record<string, WranglerVars>;
  };

  it("wrangler.jsonc を読める", () => {
    expect(error).toBeUndefined();
  });

  it.each([
    ["本番（最上位）", wrangler.vars],
    ["検証環境（env.staging）", wrangler.env?.staging?.vars],
  ])('%sで CSP_REPORT_ONLY を "false"（enforce）と明示する', (_, vars) => {
    expect(vars?.CSP_REPORT_ONLY).toBe("false");
  });

  // 本番の CSP に開発用の R2 を入れない（NatuEve_API ADR-0039 決定 6）。検証環境は assets-dev の画像を
  // 表示するため立てる（#353）。vars は env に引き継がれないため、検証環境で消すと画像が CSP で止まる。
  it.each([
    ["本番（最上位）", "false", wrangler.vars],
    ["検証環境（env.staging）", "true", wrangler.env?.staging?.vars],
  ])('%sで USE_DEV_ASSETS を "%s" と明示する', (_, expected, vars) => {
    expect(vars?.USE_DEV_ASSETS).toBe(expected);
  });
});
