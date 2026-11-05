import { signInWithGoogle } from "@/services/auth";
import {
  MOCK_AUTH_SESSION,
  ensureMockWorker,
  isMockAuthEnabled,
  resetMockWorkerFailures,
  setMockAuthSession,
} from "@/services/mockAuth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
}));

vi.mock("@/services/mockAuth", () => ({
  MOCK_AUTH_SESSION: {
    userId: "mock-user-1",
    token: "mock-access-token",
  },
  clearMockAuthSession: vi.fn(),
  ensureMockWorker: vi.fn(),
  getMockAuthSession: vi.fn(),
  isMockAuthEnabled: vi.fn(),
  resetMockWorkerFailures: vi.fn(),
  setMockAuthSession: vi.fn(),
}));

const mockedIsMockAuthEnabled = vi.mocked(isMockAuthEnabled);
const mockedEnsureMockWorker = vi.mocked(ensureMockWorker);
const mockedResetMockWorkerFailures = vi.mocked(resetMockWorkerFailures);
const mockedSetMockAuthSession = vi.mocked(setMockAuthSession);

describe("signInWithGoogle", () => {
  beforeEach(() => {
    mockedIsMockAuthEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("MSW worker の起動に失敗したらセッションを保存せず例外を投げる", async () => {
    mockedEnsureMockWorker.mockResolvedValue(false);

    await expect(signInWithGoogle()).rejects.toThrow(
      "MSW worker の起動に失敗しました",
    );

    expect(mockedResetMockWorkerFailures).toHaveBeenCalledTimes(1);
    expect(mockedSetMockAuthSession).not.toHaveBeenCalled();
  });

  it("MSW worker の起動に成功したらモックセッションを保存して true を返す", async () => {
    mockedEnsureMockWorker.mockResolvedValue(true);

    await expect(signInWithGoogle()).resolves.toBe(true);

    expect(mockedResetMockWorkerFailures).toHaveBeenCalledTimes(1);
    expect(mockedSetMockAuthSession).toHaveBeenCalledWith(MOCK_AUTH_SESSION);
  });
});
