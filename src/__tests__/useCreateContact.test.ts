import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCreateContact } from "@/hooks/useCreateContact";
import { createContact } from "@/services/contact";
import { ContactError, type CreateContactResponse } from "@/types/contact";

vi.mock("@/services/contact", () => ({
  createContact: vi.fn(),
}));

const mockedCreateContact = vi.mocked(createContact);

// Service のモックはテスト間で共有されるため、呼び出し記録を毎回リセットする
// （cleanup は setup.ts の全体 afterEach で実行済み）
afterEach(() => {
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
