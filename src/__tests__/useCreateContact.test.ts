import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCreateContact } from "@/hooks/useCreateContact";
import { createContact } from "@/services/contact";
import { ContactError, type CreateContactResponse } from "@/types/contact";

vi.mock("@/services/contact", () => ({
  createContact: vi.fn(),
}));

const mockedCreateContact = vi.mocked(createContact);

// globals: false のため testing-library の自動クリーンアップが効かない。
// renderHook も内部で render しているため明示的に片付ける。
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

const payload = {
  category: "bug",
  message: "送信ボタンが反応しません",
} as const;

const response: CreateContactResponse = {
  category: "bug",
  message: payload.message,
  receivedAt: "2026-11-20T00:00:00.000Z",
};

describe("useCreateContact", () => {
  it("成功時は Service のレスポンスをそのまま返す", async () => {
    mockedCreateContact.mockResolvedValue(response);
    const { result } = renderHook(() => useCreateContact());

    let promise!: Promise<unknown>;
    act(() => {
      promise = result.current.submit(payload);
    });
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      await promise;
    });

    expect(result.current.isSubmitting).toBe(false);
    await expect(promise).resolves.toEqual({ ok: true, response });
    expect(mockedCreateContact).toHaveBeenCalledWith(payload);
  });

  it("失敗時も例外を投げず、isSubmitting を解除した上で error を返す", async () => {
    // 例外を UI に直接伝播させず結果オブジェクトに載せることで、
    // UI 側が unhandled rejection を気にせず表示だけを行えることを確認する。
    const error = new ContactError("rate_limited", "受付上限に達しました", 429);
    mockedCreateContact.mockRejectedValue(error);
    const { result } = renderHook(() => useCreateContact());

    let promise!: Promise<unknown>;
    act(() => {
      promise = result.current.submit(payload);
    });

    await act(async () => {
      await promise;
    });

    expect(result.current.isSubmitting).toBe(false);
    await expect(promise).resolves.toEqual({ ok: false, error });
  });
});
