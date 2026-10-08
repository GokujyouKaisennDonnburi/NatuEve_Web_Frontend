import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useObjectUrls } from "@/hooks/useObjectUrls";

const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;

let createObjectURL: ReturnType<typeof vi.fn>;
let revokeObjectURL: ReturnType<typeof vi.fn>;
let counter: number;

const makeFile = (name: string) => new File(["x"], name, { type: "image/png" });

// jsdom には URL.createObjectURL / revokeObjectURL が無いため、呼び出しを観測できるモックで差し替える。
beforeEach(() => {
  counter = 0;
  createObjectURL = vi.fn(() => {
    counter += 1;
    return `blob:mock-${counter}`;
  });
  revokeObjectURL = vi.fn();
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
});

afterEach(() => {
  // 明示的な cleanup が必須。setup.ts の afterEach（cleanup）より先にこのファイルの afterEach が走り、
  // URL を元の値へ戻してしまう。jsdom には元々 createObjectURL / revokeObjectURL が無いため、
  // 先にアンマウントしておかないと、後続の cleanup で revokeObjectURL が
  // "is not a function" になり落ちる。
  cleanup();
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
});

describe("useObjectUrls", () => {
  it("files から object URL を作って返す", () => {
    const files = [makeFile("a.png"), makeFile("b.png")];

    const { result } = renderHook(() => useObjectUrls(files));

    expect(result.current).toEqual(["blob:mock-1", "blob:mock-2"]);
    expect(createObjectURL).toHaveBeenCalledWith(files[0]);
    expect(createObjectURL).toHaveBeenCalledWith(files[1]);
  });

  it("files が空なら空配列を返し、URL は作らない", () => {
    const files: File[] = [];

    const { result } = renderHook(() => useObjectUrls(files));

    expect(result.current).toEqual([]);
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("files の参照が同じ間は作り直さず、revoke もしない", () => {
    const files = [makeFile("a.png")];

    const { rerender } = renderHook(() => useObjectUrls(files));
    rerender();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("files の参照が変わると旧 URL を revoke して作り直す", () => {
    const first = [makeFile("a.png")];
    const second = [makeFile("b.png")];

    const { result, rerender } = renderHook(
      ({ files }) => useObjectUrls(files),
      { initialProps: { files: first } },
    );
    expect(result.current).toEqual(["blob:mock-1"]);

    rerender({ files: second });

    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
    expect(result.current).toEqual(["blob:mock-2"]);
  });

  it("アンマウントで現在の URL をすべて revoke する", () => {
    const files = [makeFile("a.png"), makeFile("b.png")];

    const { unmount } = renderHook(() => useObjectUrls(files));
    unmount();

    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-2");
  });
});
