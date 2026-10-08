import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useStickyClip } from "@/hooks/useStickyClip";

const createTarget = () => {
  const element = document.createElement("div");
  return {
    element,
    ref: { current: element },
  };
};

// jsdom はレイアウト計算を持たないため、getBoundingClientRect をスタブして
// バーとコンテンツの位置関係を疑似的に作る。
const stubRect = (
  element: HTMLElement,
  rect: { top: number; bottom: number },
) => {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    top: rect.top,
    bottom: rect.bottom,
    left: 0,
    right: 0,
    width: 0,
    height: rect.bottom - rect.top,
    x: 0,
    y: rect.top,
    toJSON: () => ({}),
  } as DOMRect);
};

describe("useStickyClip", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("バーの下端がコンテンツ上端より下にある場合、重なった分だけ clip-path で隠す", () => {
    const bar = createTarget();
    const content = createTarget();
    // バー下端 174px / コンテンツ上端 100px → 74px の重なり
    stubRect(bar.element, { top: 56, bottom: 174 });
    stubRect(content.element, { top: 100, bottom: 1200 });

    renderHook(() =>
      useStickyClip({ barRef: bar.ref, contentRef: content.ref }),
    );

    expect(content.element.style.clipPath).toBe("inset(74px 0 0 0)");
  });

  it("重なりがなければ clip-path は設定しない", () => {
    const bar = createTarget();
    const content = createTarget();
    stubRect(bar.element, { top: 56, bottom: 130 });
    stubRect(content.element, { top: 200, bottom: 1400 });

    renderHook(() =>
      useStickyClip({ barRef: bar.ref, contentRef: content.ref }),
    );

    expect(content.element.style.clipPath).toBe("");
  });

  it("スクロール時に再計算して clip-path を更新する", () => {
    const bar = createTarget();
    const content = createTarget();
    stubRect(bar.element, { top: 56, bottom: 130 });
    stubRect(content.element, { top: 200, bottom: 1400 });

    renderHook(() =>
      useStickyClip({ barRef: bar.ref, contentRef: content.ref }),
    );

    expect(content.element.style.clipPath).toBe("");

    act(() => {
      // スクロールでコンテンツがバーの下端(130px)より上に上がった状態を再現する
      stubRect(content.element, { top: 80, bottom: 1280 });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(content.element.style.clipPath).toBe("inset(50px 0 0 0)");
  });

  it("アンマウント時に clip-path を解除する", () => {
    const bar = createTarget();
    const content = createTarget();
    stubRect(bar.element, { top: 56, bottom: 174 });
    stubRect(content.element, { top: 100, bottom: 1200 });

    const { unmount } = renderHook(() =>
      useStickyClip({ barRef: bar.ref, contentRef: content.ref }),
    );

    expect(content.element.style.clipPath).not.toBe("");

    unmount();

    expect(content.element.style.clipPath).toBe("");
  });
});
