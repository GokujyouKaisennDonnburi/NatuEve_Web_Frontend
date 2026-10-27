import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStickySidebarState } from "@/hooks/useStickySidebarState";

const createTarget = () => {
  const parent = document.createElement("div");
  const element = document.createElement("div");
  element.style.position = "sticky";
  element.style.top = "134px";
  parent.appendChild(element);
  return {
    parent,
    element,
    ref: { current: element },
  };
};

// jsdom はレイアウト計算を持たないため、getBoundingClientRect をスタブして
// sticky 要素と親(グリッド)の位置・高さを疑似的に作る。
const stubRect = (element: HTMLElement, top: number, height: number) => {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    top,
    bottom: top + height,
    left: 0,
    right: 0,
    width: 0,
    height,
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

describe("useStickySidebarState", () => {
  it("sticky でない要素(fixed のドロワー等)は none を返す", () => {
    const target = createTarget();
    target.element.style.position = "fixed";
    stubRect(target.element, 0, 727);
    stubRect(target.parent, 0, 3000);

    const { result } = renderHook(() => useStickySidebarState(target.ref));

    expect(result.current).toBe("none");
  });

  it("親(グリッド)の高さが要素以下のときは none を返す", () => {
    const target = createTarget();
    stubRect(target.element, 371, 727);
    stubRect(target.parent, 0, 727);

    const { result } = renderHook(() => useStickySidebarState(target.ref));

    expect(result.current).toBe("none");
  });

  it("sticky 可能で粘着位置より下にあるときは hidden を返す", () => {
    const target = createTarget();
    stubRect(target.element, 371, 727);
    stubRect(target.parent, 0, 3000);

    const { result } = renderHook(() => useStickySidebarState(target.ref));

    expect(result.current).toBe("hidden");
  });

  it("sticky 可能で粘着位置に達したら auto を返す", () => {
    const target = createTarget();
    stubRect(target.element, 134, 652);
    stubRect(target.parent, 0, 3000);

    const { result } = renderHook(() => useStickySidebarState(target.ref));

    expect(result.current).toBe("auto");
  });

  it("スクロールで粘着位置を跨ぐと hidden と auto が切り替わる", () => {
    const target = createTarget();
    stubRect(target.element, 371, 727);
    stubRect(target.parent, 0, 3000);

    const { result } = renderHook(() => useStickySidebarState(target.ref));

    expect(result.current).toBe("hidden");

    act(() => {
      stubRect(target.element, 134, 652);
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe("auto");

    act(() => {
      stubRect(target.element, 371, 727);
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe("hidden");
  });

  it("イベント一覧が伸びて sticky 可能になったら hidden に切り替わる", () => {
    const target = createTarget();
    stubRect(target.element, 371, 727);
    stubRect(target.parent, 0, 727);

    const { result } = renderHook(() => useStickySidebarState(target.ref));

    expect(result.current).toBe("none");

    act(() => {
      stubRect(target.parent, 0, 3000);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe("hidden");
  });
});
