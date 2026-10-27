import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsStuck } from "@/hooks/useIsStuck";

const createTarget = () => {
  const element = document.createElement("div");
  element.style.position = "sticky";
  element.style.top = "134px";
  return {
    element,
    ref: { current: element },
  };
};

// jsdom はレイアウト計算を持たないため、getBoundingClientRect をスタブして
// sticky 要素の画面上の位置を疑似的に作る。
const stubRect = (element: HTMLElement, top: number) => {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    top,
    bottom: top,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect);
};

beforeEach(() => {
  // jsdom は ResizeObserver / requestAnimationFrame を持たないため、
  // 同期実行されるスタブで置き換える
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("requestAnimationFrame", (callback: (time: number) => void) => {
    callback(0);
    // 同期実行のため、未実行のフレームが残らないよう 0 を返す
    return 0;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useIsStuck", () => {
  it("sticky 要素が粘着位置より下にあるときは false を返す", () => {
    const target = createTarget();
    stubRect(target.element, 371);

    const { result } = renderHook(() => useIsStuck(target.ref));

    expect(result.current).toBe(false);
  });

  it("sticky 要素が粘着位置に達したら true を返す", () => {
    const target = createTarget();
    stubRect(target.element, 134);

    const { result } = renderHook(() => useIsStuck(target.ref));

    expect(result.current).toBe(true);
  });

  it("スクロールで粘着位置を跨ぐと状態が切り替わる", () => {
    const target = createTarget();
    stubRect(target.element, 371);

    const { result } = renderHook(() => useIsStuck(target.ref));

    expect(result.current).toBe(false);

    act(() => {
      stubRect(target.element, 134);
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(true);

    act(() => {
      stubRect(target.element, 371);
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(false);
  });

  it("sticky でない要素(fixed のドロワー等)は常に false を返す", () => {
    const target = createTarget();
    target.element.style.position = "fixed";
    stubRect(target.element, 0);

    const { result } = renderHook(() => useIsStuck(target.ref));

    expect(result.current).toBe(false);
  });
});
