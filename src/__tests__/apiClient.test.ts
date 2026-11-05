import { afterEach, describe, expect, it, vi } from "vitest";

// NEXT_PUBLIC_* はモジュール読み込み時に取り込まれるため、テストごとにモジュールを再読み込みする。
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("apiFetch", () => {
  it("サーバー側で NEXT_PUBLIC_API_BASE_URL が未設定なら例外を投げる", async () => {
    const fetchMock = vi.fn();
    vi.stubEnv("NEXT_PUBLIC_USE_MSW", "false");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();

    const { apiFetch } = await import("@/services/apiClient");

    await expect(apiFetch("/api/v1/events/1", { auth: false })).rejects.toThrow(
      "NEXT_PUBLIC_API_BASE_URL",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
