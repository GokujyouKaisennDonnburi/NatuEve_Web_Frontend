import { apiFetch } from "@/services/apiClient";
import { isMockAuthEnabled, syncMockWorker } from "@/services/mockAuth";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/mockAuth", () => ({
  getMockAuthSession: vi.fn(),
  isMockAuthEnabled: vi.fn(),
  syncMockWorker: vi.fn(),
}));

const mockedIsMockAuthEnabled = vi.mocked(isMockAuthEnabled);
const mockedSyncMockWorker = vi.mocked(syncMockWorker);

const stubFetch = () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("MSW 有効時は認証不要のリクエストでも worker の起動を待ってから fetch する", async () => {
    mockedIsMockAuthEnabled.mockReturnValue(true);
    let resolveWorker: () => void = () => undefined;
    mockedSyncMockWorker.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveWorker = resolve;
      }),
    );
    const fetchMock = stubFetch();

    const request = apiFetch("/api/v1/events/1", { auth: false });

    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();

    resolveWorker();
    await request;

    expect(mockedSyncMockWorker).toHaveBeenCalledWith(true);
    expect(mockedSyncMockWorker).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("MSW 無効時は worker を起動せずに fetch する", async () => {
    mockedIsMockAuthEnabled.mockReturnValue(false);
    const fetchMock = stubFetch();

    await apiFetch("/api/v1/events/1", { auth: false });

    expect(mockedSyncMockWorker).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("worker の起動に失敗しても fetch を続行する", async () => {
    mockedIsMockAuthEnabled.mockReturnValue(true);
    mockedSyncMockWorker.mockRejectedValue(new Error("worker start failed"));
    const fetchMock = stubFetch();

    await apiFetch("/api/v1/events/1", { auth: false });

    expect(mockedSyncMockWorker).toHaveBeenCalledWith(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
