import { afterEach, describe, expect, it, vi } from "vitest";

const workerMock = vi.hoisted(() => ({
  start: vi.fn(),
  stop: vi.fn(),
}));

vi.mock("@/mocks/browser", () => ({ worker: workerMock }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
  workerMock.start.mockReset();
  workerMock.stop.mockReset();
});

describe("ensureMockWorker", () => {
  it("起動に成功した場合は true を返し、警告しない", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MSW", "true");
    workerMock.start.mockResolvedValue(undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { ensureMockWorker } = await import("@/services/mockAuth");

    await expect(ensureMockWorker()).resolves.toBe(true);

    expect(workerMock.start).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it("並行して呼ばれても警告は1回だけ", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MSW", "true");
    workerMock.start.mockRejectedValue(new Error("worker start failed"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { ensureMockWorker } = await import("@/services/mockAuth");

    const results = await Promise.all([
      ensureMockWorker(),
      ensureMockWorker(),
      ensureMockWorker(),
    ]);

    expect(results).toEqual([false, false, false]);
    expect(workerMock.start).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("起動失敗は上限回数まで再試行し、以降は再試行しない", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MSW", "true");
    workerMock.start.mockRejectedValue(new Error("worker start failed"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { ensureMockWorker } = await import("@/services/mockAuth");

    expect(await ensureMockWorker()).toBe(false);
    expect(await ensureMockWorker()).toBe(false);
    expect(await ensureMockWorker()).toBe(false);

    expect(workerMock.start).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("失敗回数をリセットすると再試行できる", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MSW", "true");
    workerMock.start
      .mockRejectedValueOnce(new Error("worker start failed"))
      .mockRejectedValueOnce(new Error("worker start failed"))
      .mockResolvedValueOnce(undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { ensureMockWorker, resetMockWorkerFailures } = await import(
      "@/services/mockAuth"
    );

    expect(await ensureMockWorker()).toBe(false);
    expect(await ensureMockWorker()).toBe(false);
    expect(await ensureMockWorker()).toBe(false);

    resetMockWorkerFailures();

    expect(await ensureMockWorker()).toBe(true);
    expect(workerMock.start).toHaveBeenCalledTimes(3);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
