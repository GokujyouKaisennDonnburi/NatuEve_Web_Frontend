import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useStickyClip", () => {
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

  it("切り取り中はフォーカス移動時の着地位置をバー下端に合わせる", () => {
    const bar = createTarget();
    const content = createTarget();
    stubRect(bar.element, { top: 56, bottom: 174 });
    stubRect(content.element, { top: 100, bottom: 1200 });

    renderHook(() =>
      useStickyClip({ barRef: bar.ref, contentRef: content.ref }),
    );

    // WCAG 2.4.11 対応: フォーカス移動でクリップ領域の下までスクロールさせる
    expect(document.documentElement.style.scrollPaddingTop).toBe("174px");
  });

  it("重なりがなければ clip-path と scroll-padding-top は設定しない", () => {
    const bar = createTarget();
    const content = createTarget();
    stubRect(bar.element, { top: 56, bottom: 130 });
    stubRect(content.element, { top: 200, bottom: 1400 });

    renderHook(() =>
      useStickyClip({ barRef: bar.ref, contentRef: content.ref }),
    );

    expect(content.element.style.clipPath).toBe("");
    expect(document.documentElement.style.scrollPaddingTop).toBe("");
  });

  it("bottomMargin を指定するとバー下端+余白の位置で切り取る", () => {
    const bar = createTarget();
    const content = createTarget();
    // バー下端 130px + 余白 8px / コンテンツ上端 100px → 38px の重なり分を隠す
    stubRect(bar.element, { top: 56, bottom: 130 });
    stubRect(content.element, { top: 100, bottom: 1200 });

    renderHook(() =>
      useStickyClip({
        barRef: bar.ref,
        contentRef: content.ref,
        bottomMargin: 8,
      }),
    );

    expect(content.element.style.clipPath).toBe("inset(38px 0 0 0)");
    // 着地位置も余白分の下まで確保する
    expect(document.documentElement.style.scrollPaddingTop).toBe("138px");
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

  it("resize 時にも再計算する", () => {
    const bar = createTarget();
    const content = createTarget();
    stubRect(bar.element, { top: 56, bottom: 130 });
    stubRect(content.element, { top: 200, bottom: 1400 });

    renderHook(() =>
      useStickyClip({ barRef: bar.ref, contentRef: content.ref }),
    );

    expect(content.element.style.clipPath).toBe("");

    act(() => {
      // リサイズでバーが高くなった状態を再現する
      stubRect(bar.element, { top: 56, bottom: 260 });
      window.dispatchEvent(new Event("resize"));
    });

    expect(content.element.style.clipPath).toBe("inset(60px 0 0 0)");
  });

  it("スクロールで重なりが解消されたら clip-path を解除する", () => {
    const bar = createTarget();
    const content = createTarget();
    stubRect(bar.element, { top: 56, bottom: 130 });
    stubRect(content.element, { top: 100, bottom: 1200 });

    renderHook(() =>
      useStickyClip({ barRef: bar.ref, contentRef: content.ref }),
    );

    expect(content.element.style.clipPath).toBe("inset(30px 0 0 0)");

    act(() => {
      // スクロールを戻してコンテンツがバーの下端より下に下がった状態を再現する
      stubRect(content.element, { top: 200, bottom: 1400 });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(content.element.style.clipPath).toBe("");
    expect(document.documentElement.style.scrollPaddingTop).toBe("");
  });

  it("アンマウント時に clip-path と scroll-padding-top を解除する", () => {
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
    expect(document.documentElement.style.scrollPaddingTop).toBe("");
  });
});
