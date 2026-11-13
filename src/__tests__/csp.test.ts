// @vitest-environment node
// CSP ヘッダー文字列だけを検証するため、DOM は使わない。

import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { buildCspHeader } from "../lib/csp";
import { proxy } from "../proxy";

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
    // request 側のヘッダーは Next.js への伝播用。response と同じ値が入っている。
    expect(csp).toBe(response.headers.get("Content-Security-Policy"));
  });

  it("CSP_REPORT_ONLY=true では Report-Only ヘッダー名になる", () => {
    const original = process.env.CSP_REPORT_ONLY;
    process.env.CSP_REPORT_ONLY = "true";
    try {
      const response = proxy(
        new NextRequest("https://natueve-web.natuportal.org/event-list"),
      );

      expect(response.headers.get("Content-Security-Policy")).toBeNull();
      expect(
        response.headers.get("Content-Security-Policy-Report-Only"),
      ).toContain("script-src");
    } finally {
      if (original === undefined) {
        delete process.env.CSP_REPORT_ONLY;
      } else {
        process.env.CSP_REPORT_ONLY = original;
      }
    }
  });
});
