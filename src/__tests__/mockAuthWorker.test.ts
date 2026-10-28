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
  it("起動に成功した場合は警告しない", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MSW", "true");
    workerMock.start.mockResolvedValue(undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { ensureMockWorker } = await import("@/services/mockAuth");

    await ensureMockWorker();

    expect(workerMock.start).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it("起動失敗を1回だけ警告し、以降は再試行しない", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MSW", "true");
    workerMock.start.mockRejectedValue(new Error("worker start failed"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { ensureMockWorker } = await import("@/services/mockAuth");

    await ensureMockWorker();
    await ensureMockWorker();

    expect(workerMock.start).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
