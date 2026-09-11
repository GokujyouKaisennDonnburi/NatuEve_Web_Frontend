import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCreateTag } from "@/hooks/useCreateTag";
import { createTag } from "@/services/tag";
import type { CreateTagResponse } from "@/types/tag";

vi.mock("@/services/tag", () => ({
  createTag: vi.fn(),
}));

const mockedCreateTag = vi.mocked(createTag);

// globals: false のため testing-library の自動クリーンアップが効かない。
// renderHook も内部で render しているため明示的に片付ける。
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

// createTag をタグ名ごとに手動で解決/棄却できるようにするヘルパー。
// 「A の通信中に B を submit する」のように、複数タグの解決順序を
// テストコード側から自由に制御するために使う。
function controlledCreateTag() {
  const resolvers = new Map<
    string,
    {
      resolve: (value: CreateTagResponse) => void;
      reject: (reason: unknown) => void;
    }
  >();

  mockedCreateTag.mockImplementation(
    ({ name }) =>
      new Promise<CreateTagResponse>((resolve, reject) => {
        resolvers.set(name, { resolve, reject });
      }),
  );

  return {
    resolve: (name: string, value: CreateTagResponse) => {
      resolvers.get(name)?.resolve(value);
    },
    reject: (name: string, reason: unknown) => {
      resolvers.get(name)?.reject(reason);
    },
  };
}

describe("useCreateTag", () => {
  it("タグ A の通信中にタグ B を submit しても、B には B の id/name が返る", async () => {
    // 修正前は進行中の Promise を単一の ref で使い回していたため、
    // 通信中に別のタグ名で submit すると先勝ちの Promise が返っていた回帰バグの再現テスト。
    const control = controlledCreateTag();
    const { result } = renderHook(() => useCreateTag());

    let promiseA!: Promise<CreateTagResponse>;
    let promiseB!: Promise<CreateTagResponse>;
    act(() => {
      promiseA = result.current.submit("A");
    });
    act(() => {
      promiseB = result.current.submit("B");
    });

    // B を先に解決する。B の Promise が A ではなく B の値を受け取ることを確認する。
    await act(async () => {
      control.resolve("B", { id: "tag-b", name: "B" });
      await promiseB;
    });
    await expect(promiseB).resolves.toEqual({ id: "tag-b", name: "B" });

    // 続けて A を解決しても A 自身の値が返ることを確認する。
    await act(async () => {
      control.resolve("A", { id: "tag-a", name: "A" });
      await promiseA;
    });
    await expect(promiseA).resolves.toEqual({ id: "tag-a", name: "A" });
  });

  it("同じ名前で連続 submit すると同じ Promise が返り、createTag は1回しか呼ばれない", () => {
    // 通信中に相乗りさせることで API への重複リクエストを防いでいることの確認。
    mockedCreateTag.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useCreateTag());

    let first!: Promise<CreateTagResponse>;
    let second!: Promise<CreateTagResponse>;
    act(() => {
      first = result.current.submit("A");
      second = result.current.submit("A");
    });

    expect(first).toBe(second);
    expect(mockedCreateTag).toHaveBeenCalledTimes(1);
  });

  it("完了後に同じ名前で submit すると、createTag が改めて呼ばれる（相乗りが解除される）", async () => {
    // finally で自分の名前のエントリだけ削除しているため、完了後は
    // 同名でも新しいリクエストとして扱われることの確認。
    const control = controlledCreateTag();
    const { result } = renderHook(() => useCreateTag());

    await act(async () => {
      const promise = result.current.submit("A");
      control.resolve("A", { id: "tag-a-1", name: "A" });
      await promise;
    });

    act(() => {
      result.current.submit("A");
    });

    expect(mockedCreateTag).toHaveBeenCalledTimes(2);
  });

  it("エラー時にエントリが残らず、同じ名前で再度 submit すると改めて呼ばれる", async () => {
    // finally はエラー時にも実行されるため、エラー後は相乗り状態が残らないことの確認。
    const control = controlledCreateTag();
    const { result } = renderHook(() => useCreateTag());

    await act(async () => {
      // unhandled rejection を避けるため、reject 前に必ず catch しておく。
      const promise = result.current.submit("A").catch(() => undefined);
      control.reject("A", new Error("failed"));
      await promise;
    });

    expect(result.current.isSubmitting).toBe(false);

    act(() => {
      result.current.submit("A");
    });

    expect(mockedCreateTag).toHaveBeenCalledTimes(2);
  });

  it("isSubmitting は進行中の件数(pendingCount)に基づき、片方が完了してももう片方が進行中なら true のまま", async () => {
    // isSubmitting が単純な bool フラグではなく pendingCount > 0 から
    // 導出されていることを、複数タグを同時進行させて確認する。
    const control = controlledCreateTag();
    const { result } = renderHook(() => useCreateTag());

    let promiseA!: Promise<CreateTagResponse>;
    let promiseB!: Promise<CreateTagResponse>;
    act(() => {
      promiseA = result.current.submit("A");
    });
    expect(result.current.isSubmitting).toBe(true);

    act(() => {
      promiseB = result.current.submit("B");
    });
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      control.resolve("A", { id: "tag-a", name: "A" });
      await promiseA;
    });
    // B がまだ進行中なので isSubmitting は true のまま。
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      control.resolve("B", { id: "tag-b", name: "B" });
      await promiseB;
    });
    expect(result.current.isSubmitting).toBe(false);
  });
});
