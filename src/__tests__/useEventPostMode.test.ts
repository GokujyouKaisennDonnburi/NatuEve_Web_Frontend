import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_POST_PREVIEW_SCROLL_MAPPING } from "@/components/organisms/event-post/eventPostPreviewScroll";
import { useEventPostMode } from "@/hooks/useEventPostMode";
import type { EventPostFormErrors } from "@/hooks/useEventPostForm";
import { captureScrollSyncPoint, scrollToSyncPoint } from "@/utils/scrollSync";

// jsdom にはレイアウトが無いため、位置の測定・移動はモックして呼び出し引数で検証する。
vi.mock("@/utils/scrollSync", () => ({
  captureScrollSyncPoint: vi.fn(),
  scrollToSyncPoint: vi.fn(),
}));

const mockedCapture = vi.mocked(captureScrollSyncPoint);
const mockedScrollToSyncPoint = vi.mocked(scrollToSyncPoint);

const POINT = { targetIds: ["preview-target"], offset: 120 };
const NO_ERRORS: EventPostFormErrors = {};

let scrollTo: ReturnType<typeof vi.fn>;
let originalScrollY: PropertyDescriptor | undefined;

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, configurable: true });
}

// 書き換えた window.scrollY は、テスト後に元へ戻す。
beforeEach(() => {
  originalScrollY = Object.getOwnPropertyDescriptor(window, "scrollY");
  setScrollY(0);
  scrollTo = vi.fn();
  vi.spyOn(window, "scrollTo").mockImplementation(scrollTo);
  mockedCapture.mockReset();
  mockedCapture.mockReturnValue(POINT);
  mockedScrollToSyncPoint.mockReset();
});

afterEach(() => {
  if (originalScrollY) {
    Object.defineProperty(window, "scrollY", originalScrollY);
  } else {
    Reflect.deleteProperty(window, "scrollY");
  }
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function renderMode(initialErrors: EventPostFormErrors = NO_ERRORS) {
  return renderHook(({ errors }) => useEventPostMode(errors), {
    initialProps: { errors: initialErrors },
  });
}

describe("useEventPostMode", () => {
  it("初回マウントでは edit のまま、スクロールも位置合わせもしない", () => {
    const { result } = renderMode();

    expect(result.current.mode).toBe("edit");
    expect(scrollTo).not.toHaveBeenCalled();
    expect(mockedScrollToSyncPoint).not.toHaveBeenCalled();
  });

  it("StrictMode の二重実行でも、初回マウントではスクロールも位置合わせもしない", () => {
    const { result } = renderHook(() => useEventPostMode(NO_ERRORS), {
      wrapper: StrictMode,
    });

    expect(result.current.mode).toBe("edit");
    expect(scrollTo).not.toHaveBeenCalled();
    expect(mockedScrollToSyncPoint).not.toHaveBeenCalled();
  });

  it("edit→preview で対応表とフォーカス要素を渡して記録し、返った point で位置合わせする", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    const { result } = renderMode();

    act(() => {
      result.current.switchCaptureHandlers.onPointerDownCapture();
    });
    act(() => {
      result.current.changeMode("preview");
    });

    expect(result.current.mode).toBe("preview");
    expect(mockedCapture).toHaveBeenCalledTimes(1);
    expect(mockedCapture).toHaveBeenCalledWith(
      EVENT_POST_PREVIEW_SCROLL_MAPPING,
      input,
    );
    expect(mockedScrollToSyncPoint).toHaveBeenCalledTimes(1);
    expect(mockedScrollToSyncPoint).toHaveBeenCalledWith(POINT);
  });

  it("capture が null を返したら位置合わせしない", () => {
    mockedCapture.mockReturnValue(null);
    const { result } = renderMode();

    act(() => {
      result.current.changeMode("preview");
    });

    expect(result.current.mode).toBe("preview");
    expect(mockedScrollToSyncPoint).not.toHaveBeenCalled();
  });

  it("switchCaptureHandlers は呼んだ時点の activeElement を記録し、changeMode 後は破棄する", () => {
    const first = document.createElement("input");
    const second = document.createElement("textarea");
    document.body.append(first, second);
    const { result } = renderMode();

    // キーボード操作の側（onKeyDownCapture）でも同じく記録される
    first.focus();
    act(() => {
      result.current.switchCaptureHandlers.onKeyDownCapture();
    });
    // 記録後にフォーカスが移っても、記録した要素が使われる
    second.focus();
    act(() => {
      result.current.changeMode("preview");
    });
    expect(mockedCapture).toHaveBeenLastCalledWith(
      EVENT_POST_PREVIEW_SCROLL_MAPPING,
      first,
    );

    // 記録は破棄されているので、記録せずに行った次の切替では null になる
    act(() => {
      result.current.changeMode("edit");
    });
    act(() => {
      result.current.changeMode("preview");
    });
    expect(mockedCapture).toHaveBeenCalledTimes(2);
    expect(mockedCapture).toHaveBeenLastCalledWith(
      EVENT_POST_PREVIEW_SCROLL_MAPPING,
      null,
    );
  });

  it("preview→edit で、edit→preview 時の scrollY へ instant で戻す（preview 中に動いていても）", () => {
    setScrollY(640);
    const { result } = renderMode();
    act(() => {
      result.current.changeMode("preview");
    });
    expect(scrollTo).not.toHaveBeenCalled();

    // プレビュー側で別の位置までスクロールしている
    setScrollY(50);
    act(() => {
      result.current.changeMode("edit");
    });

    expect(result.current.mode).toBe("edit");
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 640, behavior: "instant" });
  });

  it("preview 中に errors が空でないオブジェクトへ変わると edit に戻り、保存した scrollY へ戻す", () => {
    setScrollY(320);
    const { result, rerender } = renderMode();
    act(() => {
      result.current.changeMode("preview");
    });
    setScrollY(0);

    rerender({ errors: { eventName: "必須です" } });

    expect(result.current.mode).toBe("edit");
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 320, behavior: "instant" });
  });

  it("edit 中に errors が来ても何も起きない", () => {
    const { result, rerender } = renderMode();

    rerender({ errors: { eventName: "必須です" } });

    expect(result.current.mode).toBe("edit");
    expect(scrollTo).not.toHaveBeenCalled();
    expect(mockedScrollToSyncPoint).not.toHaveBeenCalled();
  });

  it("errors が空オブジェクトに変わっても preview から切り替わらない", () => {
    const { result, rerender } = renderMode();
    act(() => {
      result.current.changeMode("preview");
    });

    rerender({ errors: {} });

    expect(result.current.mode).toBe("preview");
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("同じ errors のまま preview→edit→preview を繰り返しても勝手に edit へ戻らない", () => {
    const errors = { eventName: "必須です" };
    const { result, rerender } = renderMode();
    act(() => {
      result.current.changeMode("preview");
    });
    rerender({ errors });
    expect(result.current.mode).toBe("edit");

    act(() => {
      result.current.changeMode("preview");
    });
    expect(result.current.mode).toBe("preview");

    // 同じ参照のまま再描画しても edit に戻らない
    rerender({ errors });
    expect(result.current.mode).toBe("preview");

    act(() => {
      result.current.changeMode("edit");
    });
    act(() => {
      result.current.changeMode("preview");
    });
    expect(result.current.mode).toBe("preview");
  });
});
